import { useEffect } from 'react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from '../../../components/Modal';
import { FormInput, SelectInput, TextAreaInput } from '../../../components/FormFields';
import { createPatient, fetchAssessments, updatePatient } from '../../../redux/thunks/adminThunks';
import { useToast } from '../../../hooks/useToast';
import { toDateInput } from '../../../utils/format';

const GENDERS = [
  { value: '', label: 'Select' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];
const MARITAL = [
  { value: '', label: 'Select' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'separated', label: 'Separated' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const schema = (isEdit) =>
  Yup.object({
    fullName: Yup.string().trim().min(2, 'Too short').max(120).required('Full name is required'),
    email: Yup.string().email('Enter a valid email').required('Email is required'),
    phone: Yup.string()
      .matches(/^[+\d][\d\s-]{6,18}$/, 'Enter a valid phone number')
      .required('Phone number is required'),
    // Self-registered patients may have only an age, so date of birth is required only when staff register someone.
    dateOfBirth: isEdit
      ? Yup.date().max(new Date(), 'Date of birth must be in the past').nullable()
      : Yup.date().max(new Date(), 'Date of birth must be in the past').required('Date of birth is required'),
    pincode: Yup.string().matches(/^\d{6}$/, { message: 'Pincode must be 6 digits', excludeEmptyString: true }),
    assessmentIds: isEdit ? Yup.array() : Yup.array().of(Yup.string()),
  });

const FIELDS = ['fullName', 'email', 'phone', 'gender', 'guardianName', 'relevantInfo', 'address', 'city', 'state', 'pincode', 'location', 'maritalStatus', 'education', 'occupation', 'referredBy'];

const SectionTitle = ({ children }) => (
  <div className="col-span-full mt-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
    {children}
    <span className="h-px flex-1 bg-line" />
  </div>
);

/** Create (with invitation + optional assessments) or edit a patient. */
const PatientFormModal = ({ open, patient, onClose, onCreated }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const assessments = useSelector((s) => s.assessments.list.data);
  const isEdit = Boolean(patient);

  useEffect(() => {
    if (open && !isEdit) dispatch(fetchAssessments({ status: 'published' }));
  }, [open, isEdit, dispatch]);

  const initialValues = {
    ...Object.fromEntries(FIELDS.map((f) => [f, patient?.[f] ?? ''])),
    dateOfBirth: toDateInput(patient?.dateOfBirth),
    assessmentIds: [],
    dueDate: '',
  };

  const onSubmit = async (values, { setSubmitting }) => {
    const payload = { ...values };
    if (!payload.dueDate) delete payload.dueDate;
    try {
      if (isEdit) {
        delete payload.assessmentIds;
        await dispatch(updatePatient({ id: patient._id, data: payload })).unwrap();
        toast.success('Patient updated');
        onClose();
      } else {
        const result = await dispatch(createPatient(payload)).unwrap();
        toast.success('Patient registered');
        onCreated?.(result);
      }
    } catch (err) {
      toast.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const published = (assessments || []).filter((a) => a.status === 'published');

  return (
    <Modal open={open} onClose={onClose} size="lg" title={isEdit ? 'Edit patient' : 'Register patient'} subtitle={isEdit ? patient.patientCode : 'The patient will receive an email invitation to set their own password.'}>
      <Formik initialValues={initialValues} validationSchema={schema(isEdit)} onSubmit={onSubmit} enableReinitialize>
        {({ isSubmitting, values, setFieldValue }) => (
          <Form noValidate className="grid gap-4 sm:grid-cols-2">
            <SectionTitle>Patient details</SectionTitle>
            <FormInput name="fullName" label="Full name" required />
            <FormInput name="dateOfBirth" type="date" label="Date of birth" required={!isEdit} hint={isEdit && patient.age && !patient.dateOfBirth ? `Self-reported age: ${patient.age}` : undefined} />
            <FormInput name="email" type="email" label="Email" required hint={isEdit ? 'Changing this updates the sign-in email' : undefined} />
            <FormInput name="phone" type="tel" label="Phone number" required />
            <SelectInput name="gender" label="Gender" options={GENDERS} />
            <FormInput name="guardianName" label="Parent / guardian name" hint="For child assessments completed by a parent" />

            <SectionTitle>Address</SectionTitle>
            <div className="sm:col-span-2">
              <TextAreaInput name="address" label="Full address" rows={2} placeholder="House/Flat No., Street, Area, Landmark" />
            </div>
            <FormInput name="city" label="City" />
            <FormInput name="state" label="State" />
            <FormInput name="pincode" label="Pincode" inputMode="numeric" maxLength={6} />
            <FormInput name="location" label="Location" placeholder="District/Area" />

            <SectionTitle>About the patient</SectionTitle>
            <SelectInput name="maritalStatus" label="Marital status" options={MARITAL} />
            <FormInput name="education" label="Education" placeholder="e.g. B.E, B.Sc, M.A" />
            <FormInput name="occupation" label="Occupation" placeholder="e.g. Engineer, Student" />
            <FormInput name="referredBy" label="Referred by" placeholder="Doctor/Clinic/Person" />
            <div className="sm:col-span-2">
              <TextAreaInput name="relevantInfo" label="Relevant information" rows={2} />
            </div>

            {!isEdit && (
              <>
                <SectionTitle>Assign assessments (optional)</SectionTitle>
                <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                  {published.map((a) => {
                    const checked = values.assessmentIds.includes(a._id);
                    return (
                      <label key={a._id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${checked ? 'border-brand-500 bg-brand-50' : 'border-line'}`}>
                        <input
                          type="checkbox"
                          className="mt-0.5 accent-brand-500"
                          checked={checked}
                          onChange={() =>
                            setFieldValue('assessmentIds', checked ? values.assessmentIds.filter((id) => id !== a._id) : [...values.assessmentIds, a._id])
                          }
                        />
                        <span>
                          <span className="block font-semibold text-ink">{a.code}</span>
                          <span className="block text-xs text-muted">{a.name}</span>
                        </span>
                      </label>
                    );
                  })}
                  {!published.length && <p className="text-sm text-muted">No published assessments available.</p>}
                </div>
                {values.assessmentIds.length > 0 && <FormInput name="dueDate" type="date" label="Due date (optional)" min={toDateInput(new Date())} />}
              </>
            )}

            <div className="col-span-full flex justify-end gap-2 border-t border-line pt-4">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Register & send invitation'}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};

export default PatientFormModal;
