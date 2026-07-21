import { useState, useEffect } from 'react';
import { Send, Inbox, Settings2, MessageCircle, Copy, Check, RefreshCw, Trash2, AlertTriangle, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from './ToastProvider';
import { useThemeClasses } from '../hooks/useThemeClasses';
import {
  MsgChannel, CHANNEL_LABELS, SETUP_SQL_OUTBOX, OutboxMessage, MsgStatus,
  getEnabledChannels, setEnabledChannels, getTelegramChannel, setTelegramChannel,
  isMessagingReady, queueMany, queueMessage, getOutbox, retryMessage, deleteOutboxMessage, subscribeOutbox,
} from '../lib/messaging';

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* ignore */ } }}
      className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 rounded px-2 py-1">
      {done ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}{done ? 'Copied' : (label || 'Copy')}
    </button>
  );
}

const STATUS_STYLE: Record<MsgStatus, string> = {
  queued: 'bg-gray-100 text-gray-600',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const PER_RECIPIENT: MsgChannel[] = ['email', 'whatsapp', 'sms'];

export function Messaging() {
  const { students, debtors, branding } = useAppContext();
  const { toast } = useToast();
  const tc = useThemeClasses();
  const [tab, setTab] = useState<'compose' | 'outbox' | 'setup'>('compose');

  const [channels, setChannels] = useState(getEnabledChannels);
  const [tgChannel, setTgChannel] = useState(getTelegramChannel);
  const cloudReady = isMessagingReady();

  // Compose state
  const enabledList = (Object.keys(channels) as MsgChannel[]).filter(c => channels[c]);
  const [channel, setChannel] = useState<MsgChannel>(enabledList[0] || 'email');
  const [audience, setAudience] = useState<'all' | 'class' | 'debtors'>('all');
  const [classGrade, setClassGrade] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  // Outbox state
  const [outbox, setOutbox] = useState<OutboxMessage[]>([]);

  useEffect(() => {
    if (tab !== 'outbox' || !cloudReady) return;
    let alive = true;
    const load = () => getOutbox().then(rows => { if (alive) setOutbox(rows); });
    load();
    const unsub = subscribeOutbox(load);
    return () => { alive = false; unsub(); };
  }, [tab, cloudReady]);

  const activeStudents = students.filter(s => !s.status || s.status === 'active');
  const grades = Array.from(new Set(activeStudents.map(s => s.grade))).sort();
  const isBroadcast = channel === 'telegram';

  // Resolve the list of recipients for the chosen audience + channel.
  const buildRecipients = (): OutboxMessage[] => {
    const contactField = channel === 'email'
      ? (sid: string) => activeStudents.find(s => s.id === sid)?.guardianEmail
      : (sid: string) => activeStudents.find(s => s.id === sid)?.guardianPhone;

    let source = activeStudents;
    if (audience === 'class') source = activeStudents.filter(s => s.grade === classGrade);

    if (audience === 'debtors') {
      // Debtors with an outstanding balance and a phone (email-less)
      return debtors
        .filter(d => d.amount - d.amountPaid > 0 && d.phone)
        .map(d => ({
          channel,
          recipient: d.phone!,
          recipient_name: d.name,
          body: personalize(body, d.name),
          meta: { kind: 'debtor-reminder', debtorId: d.id },
        }));
    }

    return source
      .map(s => {
        const contact = contactField(s.id);
        if (!contact) return null;
        return {
          channel,
          recipient: contact,
          recipient_name: s.guardianName || s.name,
          subject: channel === 'email' ? `Message from ${branding.schoolName}` : undefined,
          body: personalize(body, s.guardianName || s.name),
          meta: { kind: 'broadcast', studentId: s.id },
        } as OutboxMessage;
      })
      .filter((m): m is OutboxMessage => m !== null);
  };

  const personalize = (text: string, name: string) => text.replace(/\{name\}/gi, name);

  const recipientCount = isBroadcast ? (tgChannel ? 1 : 0) : buildRecipients().length;

  const send = async () => {
    if (!cloudReady) { toast('Set up Cloud Sync first (Settings → Cloud Sync).', 'warning'); return; }
    if (!channels[channel]) { toast(`Enable ${CHANNEL_LABELS[channel]} in the Setup tab first.`, 'warning'); return; }
    if (!body.trim()) { toast('Write a message first.', 'warning'); return; }
    setBusy(true);
    if (isBroadcast) {
      if (!tgChannel) { setBusy(false); toast('Set your Telegram channel id in the Setup tab.', 'warning'); return; }
      const res = await queueMessage({ channel: 'telegram', recipient: tgChannel, recipient_name: 'Telegram channel', body });
      setBusy(false);
      if (res.ok) { toast('Broadcast queued to your Telegram channel.', 'success'); setBody(''); }
      else toast(res.error || 'Could not queue.', 'error');
      return;
    }
    const list = buildRecipients();
    if (list.length === 0) { setBusy(false); toast(`No recipients have a ${channel === 'email' ? 'guardian email' : 'guardian phone'}.`, 'warning'); return; }
    const res = await queueMany(list);
    setBusy(false);
    if (res.ok) { toast(`${res.count} message${res.count !== 1 ? 's' : ''} queued.`, 'success'); setBody(''); }
    else toast(res.error || 'Could not queue.', 'error');
  };

  const saveChannels = (next: Record<MsgChannel, boolean>) => { setChannels(next); setEnabledChannels(next); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messaging</h1>
          <p className="text-gray-600">Send announcements and reminders to parents across channels</p>
        </div>
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'compose' as const, label: 'Compose', icon: Send },
            { id: 'outbox' as const, label: 'Outbox', icon: Inbox },
            { id: 'setup' as const, label: 'Setup', icon: Settings2 },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon className="h-4 w-4" /><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {!cloudReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          Messaging uses your Supabase project to hold the outbox. Set up <strong>Settings → Cloud Sync</strong> first, then run the SQL in the Setup tab.
        </div>
      )}

      {/* ---------------- COMPOSE ---------------- */}
      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
              {enabledList.length === 0 ? (
                <p className="text-sm text-gray-400">No channels enabled yet — turn one on in the Setup tab.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {enabledList.map(c => (
                    <button key={c} onClick={() => setChannel(c)}
                      className={`text-sm font-medium rounded-lg px-3 py-1.5 border ${channel === c ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {CHANNEL_LABELS[c]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!isBroadcast && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send to</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {([['all', 'All guardians'], ['class', 'A class'], ['debtors', 'Debtors owing']] as const).map(([id, lbl]) => (
                    <button key={id} onClick={() => setAudience(id)}
                      className={`text-sm rounded-lg px-3 py-2 border ${audience === id ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
                {audience === 'class' && (
                  <select value={classGrade} onChange={e => setClassGrade(e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">— Select class —</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                )}
              </div>
            )}

            {isBroadcast && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                Telegram sends one broadcast to your channel <strong>{tgChannel || '(not set)'}</strong>. Every parent who has joined the channel receives it.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows={5} value={body} onChange={e => setBody(e.target.value)}
                placeholder={`Type your message…  Use {name} to insert the recipient's name.`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <p className="text-xs text-gray-400 mt-1">Tip: <code>{'{name}'}</code> is replaced with each recipient's name.</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-gray-500 inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {isBroadcast ? (tgChannel ? '1 broadcast' : 'No channel set') : `${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}`}
              </span>
              <button onClick={send} disabled={busy || recipientCount === 0}
                className={`flex items-center gap-2 ${tc.btn} text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50`}>
                <Send className="h-4 w-4" />{busy ? 'Queuing…' : `Queue ${isBroadcast ? 'Broadcast' : recipientCount || ''}`}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><MessageCircle className={`h-4 w-4 ${tc.text}`} />How this works</p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>You queue a message here — it's saved to your Supabase outbox.</li>
              <li>A free sender (Supabase Edge Function) picks it up and delivers it.</li>
              <li>Delivery status appears live on the <strong>Outbox</strong> tab.</li>
            </ol>
            <p className="text-xs text-gray-400 mt-3">No message is sent until the sender runs — the app only queues. See the <strong>Setup</strong> tab to switch channels on and deploy the free sender.</p>
          </div>
        </div>
      )}

      {/* ---------------- OUTBOX ---------------- */}
      {tab === 'outbox' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Recent messages</p>
            <span className="text-xs text-gray-500">Updates live</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>{['Channel', 'Recipient', 'Message', 'Status', 'When', ''].map(h =>
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {outbox.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-600">{CHANNEL_LABELS[m.channel]}</td>
                    <td className="px-4 py-2.5">
                      <p className="text-gray-900">{m.recipient_name || m.recipient}</p>
                      <p className="text-xs text-gray-400">{m.recipient}</p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[220px] truncate">{m.body}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[m.status || 'queued']}`}>{m.status || 'queued'}</span>
                      {m.status === 'failed' && m.error && <p className="text-[11px] text-red-500 mt-0.5 max-w-[160px] truncate" title={m.error}>{m.error}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                      {m.created_at ? new Date(m.created_at).toLocaleString('en-ZM', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {m.status === 'failed' && m.id && (
                        <button onClick={async () => { if (await retryMessage(m.id!)) toast('Re-queued for sending.', 'success'); }}
                          title="Retry" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><RefreshCw className="h-3.5 w-3.5" /></button>
                      )}
                      {m.id && (
                        <button onClick={async () => { if (await deleteOutboxMessage(m.id!)) { setOutbox(prev => prev.filter(x => x.id !== m.id)); } }}
                          title="Remove" className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </td>
                  </tr>
                ))}
                {outbox.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {cloudReady ? 'No messages yet — queue one from the Compose tab.' : 'Set up Cloud Sync to use the outbox.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------- SETUP ---------------- */}
      {tab === 'setup' && (
        <div className="space-y-6 max-w-3xl">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <p className="font-semibold text-gray-900 mb-1">1 · Create the outbox table</p>
            <p className="text-sm text-gray-500 mb-3">Run this once in your Supabase SQL editor (same project as Cloud Sync).</p>
            <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto whitespace-pre">{SETUP_SQL_OUTBOX}</pre>
            <div className="mt-2"><CopyButton value={SETUP_SQL_OUTBOX} label="Copy SQL" /></div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <p className="font-semibold text-gray-900 mb-1">2 · Turn on the channels you'll use</p>
            <p className="text-sm text-gray-500 mb-3">Only enabled channels appear in Compose. The actual sending is done by the free sender (step 3).</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(channels) as MsgChannel[]).map(c => (
                <button key={c} onClick={() => saveChannels({ ...channels, [c]: !channels[c] })}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${channels[c] ? 'bg-green-50 border-green-300 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}>
                  <span>{CHANNEL_LABELS[c]}</span>
                  <span className={`w-3 h-3 rounded-full ${channels[c] ? 'bg-green-500' : 'bg-gray-300'}`} />
                </button>
              ))}
            </div>
            {channels.telegram && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telegram channel id</label>
                <input value={tgChannel} onChange={e => { setTgChannel(e.target.value); setTelegramChannel(e.target.value); }}
                  placeholder="@gha_parents or -1001234567890"
                  className="w-full sm:max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1">The public @handle of your channel, or its numeric id. Add your bot as an admin of the channel.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
            <p className="font-semibold text-gray-900 mb-1">3 · Deploy the free sender</p>
            <p className="text-sm text-gray-600 mb-2">
              A small <strong>Supabase Edge Function</strong> (free tier) drains the outbox and delivers each message. It holds the provider
              secrets server-side, so nothing sensitive lives in this app. The ready-made function and step-by-step guide are in the repo:
            </p>
            <code className="text-xs bg-gray-100 rounded px-2 py-1 text-gray-700">docs/messaging/README.md</code>
            <ul className="text-sm text-gray-500 mt-3 space-y-1 list-disc list-inside">
              <li><strong>Telegram</strong> — 100% free. Create a bot with @BotFather, add it to your channel.</li>
              <li><strong>Email</strong> — free tier via Resend or any SMTP mailbox.</li>
              <li><strong>WhatsApp</strong> — free tier via Meta's WhatsApp Cloud API (needs business verification — add later).</li>
              <li><strong>SMS</strong> — Twilio or a local Zambian gateway (per-message cost).</li>
            </ul>
            <p className="text-xs text-gray-400 mt-3">No n8n or paid subscription required — the Edge Function replaces it and runs inside the Supabase project you already have.</p>
          </div>
        </div>
      )}
    </div>
  );
}
