import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { useDispatch } from 'react-redux';
import { Modal } from '../../../components/Modal';
import { FormInput, SelectInput, TextAreaInput } from '../../../components/FormFields';
import { createPatient, updatePatient } from '../../../redux/thunks/adminThunks';
import { useToast } from '../../../hooks/useToast';
import StateCombobox from '../../../components/StateCombobox';
import { INDIAN_STATES } from '../../../utils/indianStates';

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
    age: Yup.number().typeError('Age must be a number').integer('Age must be a whole number').min(1, 'Age must be at least 1').max(120, 'Age must be 120 or less').required('Age is required'),
    // Same required fields as the patient's own Register page.
    address: Yup.string().trim().min(3, 'Full address is too short').required('Full address is required'),
    city: Yup.string().trim().min(2, 'City is too short').required('City is required'),
    state: Yup.string().required('State is required').oneOf(INDIAN_STATES, 'Choose a state from the list'),
    pincode: Yup.string().required('Pincode is required').matches(/^\d{6}$/, 'Pincode must be 6 digits'),
    location: Yup.string().trim().min(2, 'Location is too short').required('Location is required'),
  });

const FIELDS = ['fullName', 'email', 'phone', 'gender', 'guardianName', 'relevantInfo', 'address', 'city', 'state', 'pincode', 'location', 'maritalStatus', 'education', 'occupation', 'referredBy'];

const SectionTitle = ({ children }) => (
  <div className="col-span-full mt-2 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-muted">
    {children}
    <span className="h-px flex-1 bg-line" />
  </div>
);

/** Create (with an email invitation) or edit a patient. Every patient sees all published quizzes, so nothing is assigned here. */
const PatientFormModal = ({ open, patient, onClose, onCreated }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const isEdit = Boolean(patient);

  const initialValues = {
    ...Object.fromEntries(FIELDS.map((f) => [f, patient?.[f] ?? ''])),
    age: patient?.ageYears ?? patient?.age ?? '',
  };

  const onSubmit = async (values, { setSubmitting }) => {
    // Age is the only age field (same as the patient's own Register page).
    const payload = { ...values, age: Number(values.age), dateOfBirth: null };
    try {
      if (isEdit) {
        const updated = await dispatch(updatePatient({ id: patient._id, data: payload })).unwrap();
        toast.success(updated.emailChangedTo ? `Email changed. A new invitation was sent to ${updated.emailChangedTo}.` : 'Patient updated');
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

  return (
    <Modal open={open} onClose={onClose} size="lg" title={isEdit ? 'Edit patient' : 'Register patient'} subtitle={isEdit ? patient.patientCode : 'The patient will receive an email invitation to set their own password.'}>
      <Formik initialValues={initialValues} validationSchema={schema(isEdit)} onSubmit={onSubmit} enableReinitialize>
        {({ isSubmitting }) => (
          <Form noValidate className="grid gap-4 sm:grid-cols-2">
            <SectionTitle>Patient details</SectionTitle>
            <FormInput name="fullName" label="Full name" required />
            <FormInput name="age" type="number" label="Age" min={1} max={120} required />
            <FormInput name="email" type="email" label="Email" required hint={isEdit ? 'Changing it sends a new invitation to the new email and stops the old email and password from working' : undefined} />
            <FormInput name="phone" type="tel" label="Phone number" required />
            <SelectInput name="gender" label="Gender" options={GENDERS} />
            <FormInput name="guardianName" label="Parent / guardian name" hint="For child assessments completed by a parent" />

            <SectionTitle>Address</SectionTitle>
            <div className="sm:col-span-2">
              <TextAreaInput name="address" label="Full address" rows={2} placeholder="House/Flat No., Street, Area, Landmark" required />
            </div>
            <FormInput name="city" label="City" required />
            <StateCombobox name="state" label="State" placeholder="State" required />
            <FormInput name="pincode" label="Pincode" inputMode="numeric" maxLength={6} required />
            <FormInput name="location" label="Location" placeholder="District/Area" required />

            <SectionTitle>About the patient</SectionTitle>
            <SelectInput name="maritalStatus" label="Marital status" options={MARITAL} />
            <FormInput name="education" label="Education" placeholder="e.g. B.E, B.Sc, M.A" />
            <FormInput name="occupation" label="Occupation" placeholder="e.g. Engineer, Student" />
            <FormInput name="referredBy" label="Referred by" placeholder="Doctor/Clinic/Person" />
            <div className="sm:col-span-2">
              <TextAreaInput name="relevantInfo" label="Relevant information" rows={2} />
            </div>

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
