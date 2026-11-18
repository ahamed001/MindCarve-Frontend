import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { FiPlus } from 'react-icons/fi';
import { PageHeader, StatCard, StatGroup } from '../../../components/Layout';
import FilterChips from '../../../components/FilterChips';
import { EmptyState, ErrorState, Loader } from '../../../components/Feedback';
import { SearchBar } from '../../../components/Table';
import { Modal } from '../../../components/Modal';
import { FormInput, SelectInput, TextAreaInput } from '../../../components/FormFields';
import AssessmentCard from '../../../components/AssessmentCard';
import { createAssessment, fetchAssessments } from '../../../redux/thunks/adminThunks';
import { useDebounce } from '../../../hooks/useDebounce';
import { useToast } from '../../../hooks/useToast';
import { QUESTION_TYPE_LABELS } from '../../../utils/format';

const createSchema = Yup.object({
  code: Yup.string().matches(/^[A-Za-z0-9-]{2,20}$/, '2–20 letters, numbers or dashes').required('Code is required'),
  name: Yup.string().min(2).max(200).required('Name is required'),
});

const CreateAssessmentModal = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  return (
    <Modal open={open} onClose={onClose} title="New assessment" subtitle="Created as a draft. Add questions and scoring, then publish.">
      <Formik
        initialValues={{ code: '', category: '', name: '', description: '', instructions: '', respondent: 'Self', primaryQuestionType: 'single_choice' }}
        validationSchema={createSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const created = await dispatch(createAssessment(values)).unwrap();
            toast.success('Assessment created');
            navigate(`/admin/questions/${created._id}`);
          } catch (err) {
            toast.error(err);
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form noValidate className="grid gap-4 sm:grid-cols-2">
            <FormInput name="code" label="Code" placeholder="e.g. PHQ-9" required />
            <FormInput name="category" label="Category" placeholder="e.g. Anxiety" />
            <FormInput name="respondent" label="Respondent" />
            <div className="sm:col-span-2">
              <FormInput name="name" label="Name" required />
            </div>
            <div className="sm:col-span-2">
              <TextAreaInput name="description" label="Description" rows={2} />
            </div>
            <div className="sm:col-span-2">
              <TextAreaInput name="instructions" label="Instructions shown to the respondent" rows={3} />
            </div>
            <SelectInput name="primaryQuestionType" label="Main question type" options={Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
            <div className="col-span-full flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create draft'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

const AssessmentLibraryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const list = useSelector((s) => s.assessments.list);
  const isAdmin = useSelector((s) => s.auth.user?.role === 'admin');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const debounced = useDebounce(search);

  const load = () => dispatch(fetchAssessments({ ...(debounced && { search: debounced }), ...(status && { status }) }));
  useEffect(() => {
    load();
  }, [debounced, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = list.data || [];
  // Library totals (computed from the unfiltered list).
  const [stats, setStats] = useState(null);
  useEffect(() => {
    if (!debounced && !status && list.status === 'succeeded') {
      setStats({ total: items.length, questions: items.reduce((n, a) => n + a.questionCount, 0), active: items.filter((a) => a.status === 'published').length });
    }
  }, [items, debounced, status, list.status]);
  return (
    <>
      <PageHeader
        title="Questions & Answers"
        subtitle="How patients respond to each assessment question"
        actions={
          isAdmin && (
            <button type="button" className="btn-primary" onClick={() => setCreateOpen(true)}>
              <FiPlus /> New assessment
            </button>
          )
        }
      />
      {stats && !debounced && !status && (
        <div className="mb-6">
          <StatGroup>
            <StatCard compact value={stats.total} label="Quizzes" />
            <StatCard compact value={stats.questions} label="Total questions" />
            <StatCard compact value={stats.active} label="Active quizzes" />
          </StatGroup>
        </div>
      )}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title, code or category" className="sm:w-80" />
        <FilterChips
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'All' },
            { value: 'published', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
        <span className="text-xs text-muted sm:ml-auto">{items.length} quizzes</span>
      </div>
      {list.status === 'failed' ? (
        <div className="card">
          <ErrorState message={list.error} onRetry={load} />
        </div>
      ) : list.status === 'loading' && !items.length ? (
        <Loader />
      ) : !items.length ? (
        <div className="card">
          <EmptyState title="No assessments found" message="Try a different search or create a new assessment." />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((a) => (
            <AssessmentCard key={a._id} assessment={a} onOpen={() => navigate(`/admin/questions/${a._id}`)} />
          ))}
        </div>
      )}
      <CreateAssessmentModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
};

export default AssessmentLibraryPage;
