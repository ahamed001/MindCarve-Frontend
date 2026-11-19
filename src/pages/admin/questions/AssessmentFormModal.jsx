import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Modal } from '../../../components/Modal';
import { FormInput, SelectInput, TextAreaInput } from '../../../components/FormFields';
import { QUESTION_TYPE_LABELS } from '../../../utils/format';

const schema = (isEdit) =>
  Yup.object({
    code: isEdit ? Yup.string() : Yup.string().matches(/^[A-Za-z0-9-]{2,20}$/, 'Use 2–20 letters, numbers or dashes').required('Code is required'),
    name: Yup.string().trim().min(2, 'Too short').max(200).required('Name is required'),
  });

const RESPONDENTS = ['Self', 'Parent / Guardian', 'Examiner'];

/** Create a new questionnaire (as a draft) or edit an existing one's details. */
const AssessmentFormModal = ({ open, assessment, saving, onSubmit, onClose }) => {
  const isEdit = Boolean(assessment);
  const initial = {
    code: assessment?.code || '',
    name: assessment?.name || '',
    category: assessment?.category || '',
    description: assessment?.description || '',
    instructions: assessment?.instructions || '',
    primaryQuestionType: assessment?.primaryQuestionType || 'single_choice',
    respondent: assessment?.respondent || 'Self',
    timeframe: assessment?.timeframe || '',
  };
  // Built-in questionnaires may have a more detailed wording (e.g. ISAA's examiner note); keep it selectable.
  const respondentOptions = [...new Set([...RESPONDENTS, initial.respondent])].map((value) => ({ value, label: value }));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit details' : 'New assessment'}
      subtitle={isEdit ? 'Changes reach patients after you publish.' : 'Created as a draft. Patients see it only after you add questions and publish.'}
    >
      <Formik initialValues={initial} validationSchema={schema(isEdit)} onSubmit={(values) => onSubmit(isEdit ? { ...values, code: undefined } : values)} enableReinitialize>
        <Form noValidate className="grid gap-4 sm:grid-cols-2">
          <FormInput name="code" label="Code" placeholder="e.g. PHQ-9" required={!isEdit} disabled={isEdit} hint={isEdit ? 'The code cannot be changed' : undefined} />
          <FormInput name="category" label="Category" placeholder="e.g. Anxiety" />
          <div className="sm:col-span-2">
            <FormInput name="name" label="Name" required />
          </div>
          <div className="sm:col-span-2">
            <TextAreaInput name="description" label="Description" rows={2} />
          </div>
          <div className="sm:col-span-2">
            <TextAreaInput name="instructions" label="Instructions shown to patients" rows={3} />
          </div>
          <SelectInput name="respondent" label="Who answers" options={respondentOptions} />
          <FormInput name="timeframe" label="Time period" placeholder="e.g. The past week" />
          <div className="sm:col-span-2">
            <SelectInput
              name="primaryQuestionType"
              label="Main question type"
              hint="New questions start with this type and its answers filled in. You can change it per question."
              options={Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <div className="col-span-full flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save details' : 'Create draft'}
            </button>
          </div>
        </Form>
      </Formik>
    </Modal>
  );
};

export default AssessmentFormModal;
