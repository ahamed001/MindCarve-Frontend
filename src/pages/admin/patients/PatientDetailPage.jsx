import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiArrowLeft, FiClipboard, FiEdit2, FiSend } from 'react-icons/fi';
import { Card, InfoRow, PageHeader } from '../../../components/Layout';
import { AsyncContent, EmptyState } from '../../../components/Feedback';
import { DemoTag, RiskBadge, StatusBadge } from '../../../components/Badges';
import { ConfirmationDialog } from '../../../components/Modal';
import ActivityTimeline from '../../../components/ActivityTimeline';
import PatientFormModal from './PatientFormModal';
import AssignModal from './AssignModal';
import InvitationResultModal from './InvitationResultModal';
import { addClinicianNote, cancelAssignment, fetchPatientDetail, resendInvitation, setPatientStatus } from '../../../redux/thunks/adminThunks';
import { clearPatientDetail } from '../../../redux/slices/adminSlices';
import { useToast } from '../../../hooks/useToast';
import { ageGender, formatDate, formatDateTime, relativeTime } from '../../../utils/format';

const resultSummary = (result) => {
  if (!result) return null;
  if (result.status === 'not_configured') return <span className="text-xs text-muted">Responses stored · scoring awaiting configuration</span>;
  if (result.status !== 'scored') return <span className="text-xs text-muted">{result.status}</span>;
  return (
    <span className="text-xs text-ink-soft">
      {result.total ? `Score ${result.total.score}${result.total.band ? ` · ${result.total.band.label}` : ''}` : 'Subscale profile'}
    </span>
  );
};

const AssignmentRow = ({ a, isAdmin, onCancel }) => (
  <li className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center">
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-ink">{a.assessment.code}</span>
        <span className="text-xs text-muted">v{a.version}</span>
        {a.attemptCode && <span className="text-xs font-medium text-brand-600">{a.attemptCode}</span>}
        <StatusBadge status={a.status} />
        {a.result && <RiskBadge level={a.result.riskLevel} />}
        {a.result?.reviewStatus === 'flagged' && <StatusBadge status="flagged" />}
      </div>
      <p className="truncate text-sm text-muted">{a.assessment.name}</p>
      <p className="mt-0.5 text-xs text-muted">
        Assigned {formatDate(a.assignedAt)}
        {a.dueDate && ` · Due ${formatDate(a.dueDate)}`}
        {a.completedAt && ` · Completed ${formatDateTime(a.completedAt)}`}
      </p>
      {resultSummary(a.result)}
    </div>
    <div className="flex gap-2">
      {a.status === 'completed' && (
        <Link to={`/admin/submissions/${a._id}`} className="btn-outline px-3 py-2">
          View responses
        </Link>
      )}
      {isAdmin && ['assigned', 'in_progress'].includes(a.status) && (
        <button type="button" className="btn-ghost px-3 py-2 text-risk-high" onClick={() => onCancel(a)}>
          Cancel
        </button>
      )}
    </div>
  </li>
);

const NotesCard = ({ patientId, notes }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const add = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    try {
      await dispatch(addClinicianNote({ id: patientId, body })).unwrap();
      setBody('');
      toast.success('Note added');
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Clinician notes" bodyClassName="p-6">
      <form onSubmit={add} className="mb-5">
        <label htmlFor="note" className="sr-only">
          New note
        </label>
        <textarea id="note" className="input" rows={3} maxLength={5000} placeholder="Add a note (visible to staff only)…" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="mt-2 flex justify-end">
          <button type="submit" className="btn-primary px-4 py-2" disabled={busy || !body.trim()}>
            {busy ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </form>
      {notes.length ? (
        <ul className="space-y-4">
          {notes.map((n) => (
            <li key={n._id} className="rounded-xl bg-canvas p-4">
              <p className="whitespace-pre-wrap text-sm text-ink">{n.body}</p>
              <p className="mt-2 text-xs text-muted">
                {n.author?.name} · {formatDateTime(n.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No notes yet.</p>
      )}
    </Card>
  );
};

const PatientDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const detail = useSelector((s) => s.patients.detail);
  const isAdmin = useSelector((s) => s.auth.user?.role === 'admin');
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const load = () => dispatch(fetchPatientDetail(id));
  useEffect(() => {
    load();
    return () => dispatch(clearPatientDetail());
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const runConfirm = async () => {
    setBusy(true);
    try {
      await confirm.action();
      setConfirm(null);
    } catch (err) {
      toast.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/admin/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <FiArrowLeft /> All patients
      </Link>
      <AsyncContent resource={detail} onRetry={load}>
        {({ patient, invitation, assignments, notes, activity }) => {
          const pending = assignments.filter((a) => ['assigned', 'in_progress'].includes(a.status));
          const completed = assignments.filter((a) => a.status === 'completed');
          const other = assignments.filter((a) => a.status === 'cancelled');
          const invitePending = patient.accountStatus === 'invited';
          return (
            <>
              <PageHeader
                title={patient.fullName}
                eyebrow={
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-brand-600">{patient.patientCode}</span>
                    <StatusBadge status={patient.status} />
                    {invitePending && <StatusBadge status="invited" />}
                    <DemoTag show={patient.isDemo} />
                  </div>
                }
                subtitle={`${ageGender(patient)} · Registered ${formatDate(patient.createdAt)}${patient.source === 'self_registration' ? ' (self-registered)' : ''}`}
                actions={
                  isAdmin && (
                    <>
                      {invitePending && patient.status === 'active' && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={async () => {
                            try {
                              setInviteResult(await dispatch(resendInvitation(patient._id)).unwrap());
                              load();
                            } catch (err) {
                              toast.error(err);
                            }
                          }}
                        >
                          <FiSend /> Resend invite
                        </button>
                      )}
                      <button type="button" className="btn-secondary" onClick={() => setEditOpen(true)}>
                        <FiEdit2 /> Edit
                      </button>
                      <button type="button" className="btn-primary" onClick={() => setAssignOpen(true)} disabled={patient.status !== 'active'}>
                        <FiClipboard /> Assign
                      </button>
                    </>
                  )
                }
              />

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-6">
                  <Card title={`Pending assessments (${pending.length})`} bodyClassName="">
                    {pending.length ? (
                      <ul className="divide-y divide-line">
                        {pending.map((a) => (
                          <AssignmentRow key={a._id} a={a} isAdmin={isAdmin} onCancel={(x) => setConfirm({ title: 'Cancel assignment?', message: `${x.assessment.code} will be removed from the patient’s list. Saved answers are kept for audit.`, label: 'Cancel assignment', action: async () => { await dispatch(cancelAssignment(x._id)).unwrap(); toast.success('Assignment cancelled'); load(); } })} />
                        ))}
                      </ul>
                    ) : (
                      <EmptyState title="No pending assessments" />
                    )}
                  </Card>
                  <Card title={`Assessment history (${completed.length})`} bodyClassName="">
                    {completed.length ? (
                      <ul className="divide-y divide-line">
                        {completed.map((a) => (
                          <AssignmentRow key={a._id} a={a} isAdmin={isAdmin} />
                        ))}
                      </ul>
                    ) : (
                      <EmptyState title="No completed assessments yet" />
                    )}
                    {other.length > 0 && <p className="border-t border-line px-6 py-3 text-xs text-muted">{other.length} cancelled assignment(s) not shown.</p>}
                  </Card>
                  <NotesCard patientId={patient._id} notes={notes} />
                </div>

                <div className="space-y-6">
                  <Card title="Profile">
                    <InfoRow label="Email">{patient.email}</InfoRow>
                    <InfoRow label="Phone">{patient.phone || '—'}</InfoRow>
                    {patient.dateOfBirth ? <InfoRow label="Date of birth">{formatDate(patient.dateOfBirth)}</InfoRow> : <InfoRow label="Age">{patient.age ?? '—'}</InfoRow>}
                    <InfoRow label="Declaration">{patient.declaration?.accepted ? `Signed ${formatDate(patient.declaration.acceptedAt)}` : 'Pending'}</InfoRow>
                    {patient.guardianName && <InfoRow label="Guardian">{patient.guardianName}</InfoRow>}
                    {(patient.city || patient.state) && <InfoRow label="Location">{[patient.location, patient.city, patient.state, patient.pincode].filter(Boolean).join(', ')}</InfoRow>}
                    {patient.occupation && <InfoRow label="Occupation">{patient.occupation}</InfoRow>}
                    {patient.referredBy && <InfoRow label="Referred by">{patient.referredBy}</InfoRow>}
                    <InfoRow label="Last sign-in">{patient.lastLoginAt ? relativeTime(patient.lastLoginAt) : 'Never'}</InfoRow>
                    {invitation && (
                      <InfoRow label="Invitation">
                        {invitation.usedAt ? `Accepted ${formatDate(invitation.usedAt)}` : `${invitation.emailStatus === 'failed' ? 'Email failed' : 'Sent'} · expires ${formatDate(invitation.expiresAt)}`}
                      </InfoRow>
                    )}
                    {patient.relevantInfo && <p className="mt-3 rounded-xl bg-canvas p-3 text-sm text-ink-soft">{patient.relevantInfo}</p>}
                    {isAdmin && (
                      <button
                        type="button"
                        className={`mt-4 w-full ${patient.status === 'active' ? 'btn-secondary text-risk-high' : 'btn-secondary'}`}
                        onClick={() =>
                          setConfirm({
                            title: patient.status === 'active' ? 'Deactivate patient?' : 'Reactivate patient?',
                            message:
                              patient.status === 'active'
                                ? 'The patient will be signed out and unable to sign in. Records are kept.'
                                : 'The patient will be able to sign in again.',
                            label: patient.status === 'active' ? 'Deactivate' : 'Reactivate',
                            danger: patient.status === 'active',
                            action: async () => {
                              await dispatch(setPatientStatus({ id: patient._id, status: patient.status === 'active' ? 'inactive' : 'active' })).unwrap();
                              toast.success('Patient status updated');
                            },
                          })
                        }
                      >
                        {patient.status === 'active' ? 'Deactivate patient' : 'Reactivate patient'}
                      </button>
                    )}
                  </Card>
                  <Card title="Recent activity">{activity.length ? <ActivityTimeline items={activity} /> : <p className="text-sm text-muted">No activity yet.</p>}</Card>
                </div>
              </div>

              <PatientFormModal open={editOpen} patient={patient} onClose={() => setEditOpen(false)} />
              <AssignModal
                open={assignOpen}
                patient={patient}
                activeAssessmentIds={pending.map((a) => a.assessment._id)}
                onClose={() => setAssignOpen(false)}
                onAssigned={() => {
                  setAssignOpen(false);
                  load();
                }}
              />
            </>
          );
        }}
      </AsyncContent>
      <ConfirmationDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.label}
        tone={confirm?.danger ? 'danger' : 'primary'}
        busy={busy}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
      <InvitationResultModal result={inviteResult} onClose={() => setInviteResult(null)} />
    </>
  );
};

export default PatientDetailPage;
