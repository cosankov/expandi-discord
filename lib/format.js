// Discord Embed formatter for Expandi webhook events
// Docs: https://discord.com/developers/docs/resources/webhook#execute-webhook

const EVENT_LABELS = {
  'linked_in_messenger.campaign_replied': { emoji: '\u{1F4AC}', label: 'New Reply', color: 0x3B82F6 },
  'linked_in_messenger.campaign_connected': { emoji: '\u{1F91D}', label: 'Connection Accepted', color: 0x22C55E },
  'linked_in_messenger.campaign_message_sent': { emoji: '\u{1F4E4}', label: 'Message Sent', color: 0x6B7280 },
  'linked_in_messenger.campaign_invite_sent': { emoji: '\u{1F4E8}', label: 'Connection Request Sent', color: 0x6B7280 },
  'linked_in_messenger.campaign_profile_visited': { emoji: '\u{1F441}', label: 'Profile Visited', color: 0x6B7280 },
  'linked_in_messenger.campaign_post_liked': { emoji: '\u{1F44D}', label: 'Post Liked', color: 0x6B7280 },
  'linked_in_messenger.campaign_follow_sent': { emoji: '\u{2795}', label: 'Follow Sent', color: 0x6B7280 },
  'linked_in_messenger.campaign_company_follow_sent': { emoji: '\u{1F3E2}', label: 'Company Follow Sent', color: 0x6B7280 },
  'linked_in_messenger.campaign_endorsement_sent': { emoji: '\u{2B50}', label: 'Endorsement Sent', color: 0x6B7280 },
  'linked_in_messenger.campaign_contact_tagged': { emoji: '\u{1F3F7}', label: 'Contact Tagged', color: 0x6B7280 },
  'linked_in_messenger.campaign_contact_disconnected': { emoji: '\u{1F50C}', label: 'Contact Disconnected', color: 0xEF4444 },
  'linked_in_messenger.campaign_contact_revoked': { emoji: '\u{274C}', label: 'Connection Revoked', color: 0xEF4444 },
  'linked_in_messenger.campaign_finished': { emoji: '\u{2705}', label: 'Campaign Finished', color: 0x22C55E },
  'linked_in_messenger.campaign_email_sent': { emoji: '\u{2709}\u{FE0F}', label: 'Email Sent', color: 0x6B7280 },
  'linked_in_messenger.campaign_email_opened': { emoji: '\u{1F4EC}', label: 'Email Opened', color: 0x6B7280 },
  'linked_in_messenger.campaign_email_clicked': { emoji: '\u{1F517}', label: 'Email Link Clicked', color: 0x6B7280 },
  'linked_in_messenger.campaign_email_bounced': { emoji: '\u{26A0}\u{FE0F}', label: 'Email Bounced', color: 0xEAB308 },
  'linked_in_messenger.campaign_first_reply': { emoji: '\u{1F3AF}', label: 'First Reply', color: 0x3B82F6 },
  'linked_in_messenger.no_connection_requests_scheduled': { emoji: '\u{1F4CB}', label: 'No Connection Requests Scheduled', color: 0xEAB308 },
  'linked_in_messenger.no_messages_scheduled': { emoji: '\u{1F4CB}', label: 'No Messages Scheduled', color: 0xEAB308 },
  'linked_in_messenger.nothing_scheduled': { emoji: '\u{1F4CB}', label: 'Nothing Scheduled', color: 0xEAB308 },
};

function getEventInfo(event) {
  return EVENT_LABELS[event] || { emoji: '\u{1F514}', label: event.split('.').pop().replace(/_/g, ' '), color: 0x6B7280 };
}

function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  return str.startsWith('https://') || str.startsWith('http://');
}

function truncate(str, max = 300) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// --- Event-specific formatters ---

function formatReply(payload) {
  const { hook, contact, messenger, campaign_instance_contact } = payload;
  const eventInfo = getEventInfo(hook.event);
  const campaign = messenger?.campaign_instance || 'Unknown Campaign';
  const sender = hook.li_account_name || 'Unknown';

  const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const title = contact?.job_title || '';
  const company = contact?.company;

  let companyLine = '';
  if (company) {
    const parts = [company.name];
    if (company.employee_count_start && company.employee_count_end) {
      parts.push(`${company.employee_count_start}-${company.employee_count_end} employees`);
    }
    if (company.location) parts.push(company.location);
    companyLine = parts.join(' \u00B7 ');
  } else if (contact?.company_name) {
    companyLine = contact.company_name;
  }

  let description = '';
  if (title) description += title + '\n';
  if (companyLine) description += companyLine + '\n';

  // Their reply
  if (messenger?.last_received_message) {
    description += '\n\u{1F4AC} **Their reply:**\n> ' + truncate(messenger.last_received_message).split('\n').join('\n> ') + '\n';
  }

  // What you sent
  if (messenger?.last_sent_message) {
    description += '\n\u{1F4E4} **You sent:**\n> ' + truncate(messenger.last_sent_message).split('\n').join('\n> ') + '\n';
  }

  // Stats
  const stats = [];
  if (campaign_instance_contact?.nr_steps_before_responding) {
    stats.push(`Steps before reply: **${campaign_instance_contact.nr_steps_before_responding}**`);
  }
  if (messenger?.connected_at) {
    stats.push(`Connected: **${formatDate(messenger.connected_at)}**`);
  }
  if (messenger?.last_received_message_datetime) {
    stats.push(`Replied: **${formatDate(messenger.last_received_message_datetime)}**`);
  }
  if (stats.length > 0) {
    description += '\n' + stats.join('  \u00B7  ');
  }

  // Links
  const links = [];
  if (isValidUrl(contact?.profile_link)) links.push(`[\u{1F517} LinkedIn](${contact.profile_link})`);
  if (isValidUrl(messenger?.lead_inbox_link)) links.push(`[\u{1F4E5} Expandi Inbox](${messenger.lead_inbox_link})`);
  if (isValidUrl(contact?.sales_nav_link)) links.push(`[\u{1F50E} Sales Nav](${contact.sales_nav_link})`);
  if (isValidUrl(messenger?.thread)) links.push(`[\u{1F4AC} Thread](${messenger.thread})`);
  if (links.length > 0) {
    description += '\n\n' + links.join('  \u00B7  ');
  }

  const embed = {
    title: `${eventInfo.emoji} ${eventInfo.label}`,
    description,
    color: eventInfo.color,
    footer: { text: `Campaign: ${campaign}  \u00B7  Sender: ${sender}` },
    timestamp: hook.fired_datetime ? new Date(hook.fired_datetime).toISOString() : undefined,
  };

  // Author = contact name
  embed.author = { name };
  if (isValidUrl(contact?.profile_link)) embed.author.url = contact.profile_link;

  // Thumbnail = contact photo
  if (isValidUrl(contact?.image_link)) {
    embed.thumbnail = { url: contact.image_link };
  }

  return embed;
}

function formatConnection(payload) {
  const { hook, contact, messenger } = payload;
  const eventInfo = getEventInfo(hook.event);
  const campaign = messenger?.campaign_instance || 'Unknown Campaign';
  const sender = hook.li_account_name || 'Unknown';

  const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const title = contact?.job_title || '';
  const company = contact?.company;

  let description = '';
  if (title) description += title + '\n';

  if (company) {
    const parts = [company.name];
    if (company.employee_count_start && company.employee_count_end) {
      parts.push(`${company.employee_count_start}-${company.employee_count_end} employees`);
    }
    if (company.location) parts.push(company.location);
    description += parts.join(' \u00B7 ') + '\n';
  } else if (contact?.company_name) {
    description += contact.company_name + '\n';
  }

  if (messenger?.connected_at) {
    description += `\nConnected: **${formatDate(messenger.connected_at)}**`;
  }

  const links = [];
  if (isValidUrl(contact?.profile_link)) links.push(`[\u{1F517} LinkedIn](${contact.profile_link})`);
  if (isValidUrl(messenger?.lead_inbox_link)) links.push(`[\u{1F4E5} Expandi Inbox](${messenger.lead_inbox_link})`);
  if (isValidUrl(contact?.sales_nav_link)) links.push(`[\u{1F50E} Sales Nav](${contact.sales_nav_link})`);
  if (links.length > 0) description += '\n\n' + links.join('  \u00B7  ');

  const embed = {
    title: `${eventInfo.emoji} ${eventInfo.label}`,
    description,
    color: eventInfo.color,
    footer: { text: `Campaign: ${campaign}  \u00B7  Sender: ${sender}` },
    timestamp: hook.fired_datetime ? new Date(hook.fired_datetime).toISOString() : undefined,
  };

  embed.author = { name };
  if (isValidUrl(contact?.profile_link)) embed.author.url = contact.profile_link;
  if (isValidUrl(contact?.image_link)) embed.thumbnail = { url: contact.image_link };

  return embed;
}

function formatGenericAction(payload) {
  const { hook, contact, messenger } = payload;
  const eventInfo = getEventInfo(hook.event);
  const campaign = messenger?.campaign_instance || 'Unknown Campaign';
  const sender = hook.li_account_name || 'Unknown';

  const name = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'Unknown';
  let description = '';
  if (contact?.job_title) description += contact.job_title + '\n';
  if (contact?.company?.name) description += contact.company.name;

  const links = [];
  if (isValidUrl(contact?.profile_link)) links.push(`[\u{1F517} LinkedIn](${contact.profile_link})`);
  if (isValidUrl(messenger?.lead_inbox_link)) links.push(`[\u{1F4E5} Expandi Inbox](${messenger.lead_inbox_link})`);
  if (links.length > 0) description += '\n\n' + links.join('  \u00B7  ');

  const embed = {
    title: `${eventInfo.emoji} ${eventInfo.label}`,
    description,
    color: eventInfo.color,
    footer: { text: `Campaign: ${campaign}  \u00B7  Sender: ${sender}` },
    timestamp: hook.fired_datetime ? new Date(hook.fired_datetime).toISOString() : undefined,
  };

  embed.author = { name };
  if (isValidUrl(contact?.profile_link)) embed.author.url = contact.profile_link;
  if (isValidUrl(contact?.image_link)) embed.thumbnail = { url: contact.image_link };

  return embed;
}

function formatSystemEvent(payload) {
  const { hook } = payload;
  const eventInfo = getEventInfo(hook.event);
  const sender = hook.li_account_name || 'Unknown';

  return {
    title: `${eventInfo.emoji} ${eventInfo.label}`,
    description: `Account: **${sender}**`,
    color: eventInfo.color,
    timestamp: hook.fired_datetime ? new Date(hook.fired_datetime).toISOString() : undefined,
  };
}

// --- Main formatter ---

function formatExpandiPayload(payload) {
  const event = payload?.hook?.event || '';

  if (event.includes('replied') || event.includes('first_reply')) {
    return formatReply(payload);
  }

  if (event.includes('connected') || event.includes('invite_sent') || event.includes('revoked') || event.includes('disconnected')) {
    return formatConnection(payload);
  }

  if (event.includes('no_') || event.includes('nothing_scheduled')) {
    return formatSystemEvent(payload);
  }

  return formatGenericAction(payload);
}

function buildDiscordPayload(payload) {
  const embed = formatExpandiPayload(payload);

  const event = payload?.hook?.event || 'unknown';
  const eventInfo = getEventInfo(event);
  const contactName = [payload?.contact?.first_name, payload?.contact?.last_name].filter(Boolean).join(' ');
  const campaign = payload?.messenger?.campaign_instance || '';

  let content = `${eventInfo.emoji} ${eventInfo.label}`;
  if (contactName) content += ` \u2014 ${contactName}`;
  if (campaign) content += ` (${campaign})`;

  return {
    content,
    embeds: [embed],
    username: 'Expandi Responses',
    avatar_url: 'https://app.expandi.io/favicon.ico',
  };
}

module.exports = { buildDiscordPayload, getEventInfo };
