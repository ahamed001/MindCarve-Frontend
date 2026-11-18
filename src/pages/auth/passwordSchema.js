import * as Yup from 'yup';

// Mirrors the server rule: 8–128 chars, at least one letter and one number.
export const passwordSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Use at least 8 characters')
    .max(128, 'Too long')
    .matches(/[A-Za-z]/, 'Include at least one letter')
    .matches(/\d/, 'Include at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
});
