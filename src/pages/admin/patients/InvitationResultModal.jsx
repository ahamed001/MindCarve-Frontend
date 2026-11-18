import { Modal } from '../../../components/Modal';
import { formatDateTime } from '../../../utils/format';

const EMAIL_STATUS = {
  sent: 'Invitation email sent.',
  logged_dev: 'SMTP is not configured: the email was saved to server/dev-mail instead of being sent (development fallback).',
  failed: 'The invitation email could not be sent. Check SMTP settings and resend from the patient page.',
  pending: 'Invitation email pending.',
};

/** Shown after registering a patient or resending an invitation. */
const InvitationResultModal = ({ result, onClose, onViewPatient }) => {
  if (!result) return null;
  const { invitation, devInviteLink, patient, assignments } = result;
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={patient ? `${patient.fullName} registered` : 'Invitation resent'}
      subtitle={patient?.patientCode}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
          {onViewPatient && (
            <button type="button" className="btn-primary" onClick={onViewPatient}>
              View patient
            </button>
          )}
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <p className={invitation.emailStatus === 'failed' ? 'text-risk-high' : 'text-ink-soft'}>{EMAIL_STATUS[invitation.emailStatus]}</p>
        <p className="text-muted">The link is single-use and expires {formatDateTime(invitation.expiresAt)}. No password is ever emailed.</p>
        {assignments && (
          <p className="text-ink-soft">
            {assignments.created} assessment(s) assigned
            {assignments.skipped?.length ? ` · ${assignments.skipped.length} skipped (${assignments.skipped.map((s) => `${s.code}: ${s.reason}`).join('; ')})` : ''}
          </p>
        )}
        {devInviteLink && (
          <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50 p-3 text-xs text-brand-700">
            <strong>Development only</strong> — this link is returned by the API only outside production so the flow can be demonstrated:
            <a href={devInviteLink} target="_blank" rel="noreferrer" className="mt-1 block break-all font-semibold underline">
              {devInviteLink}
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default InvitationResultModal;
