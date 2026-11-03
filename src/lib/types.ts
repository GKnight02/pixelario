export type Theme = "system" | "day" | "night";
export type Channel = "app" | "email";
export type PreferenceKind = "like" | "dislike";
export type DateType = "birthday" | "anniversary" | "saint" | "custom";
export type GiftStatus = "idea" | "bought" | "given";
export type Repeat = "none" | "weekly" | "monthly" | "yearly";

export interface Profile {
  id: string;
  display_name: string | null;
  timezone: string;
  theme: Theme;
  default_reminder_channels: Channel[];
  onboarded: boolean;
}

export interface Person {
  id: string;
  owner_id: string;
  name: string;
  nickname: string | null;
  relationship: string;
  cover_color: string;
  avatar_url: string | null;
  tagline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  owner_id: string | null;
  name: string;
  icon: string;
  sort_order: number;
}

export interface Preference {
  id: string;
  person_id: string;
  category_id: string | null;
  kind: PreferenceKind;
  title: string;
  note: string | null;
  intensity: number;
  changed_at: string | null;
  created_at: string;
}

export interface Anecdote {
  id: string;
  person_id: string;
  title: string;
  body: string | null;
  happened_on: string | null;
  place: string | null;
  mood: string | null;
  photos: string[];
  is_private: boolean;
  created_at: string;
}

export interface ImportantDate {
  id: string;
  person_id: string;
  type: DateType;
  label: string;
  month: number;
  day: number;
  year: number | null;
  recurring: boolean;
  remind_days_before: number[];
}

export interface GiftIdea {
  id: string;
  person_id: string;
  preference_id: string | null;
  date_id: string | null;
  title: string;
  price_estimate: number | null;
  url: string | null;
  note: string | null;
  status: GiftStatus;
  created_at: string;
}

export interface Reminder {
  id: string;
  owner_id: string;
  person_id: string | null;
  date_id: string | null;
  title: string;
  note: string | null;
  due_at: string;
  repeat: Repeat;
  channels: Channel[];
  done_at: string | null;
  last_sent_at: string | null;
}

export interface ShareSections {
  likes: boolean;
  dislikes: boolean;
  anecdotes: boolean;
  dates: boolean;
  gifts: boolean;
  reminders: boolean;
}

export interface ShareLink {
  id: string;
  person_id: string;
  token: string;
  sections: ShareSections;
  expires_at: string | null;
  is_active: boolean;
  view_count: number;
}

/** Fila de preferencia lista para mostrar (con categoría resuelta). */
export interface PreferenceView {
  id: string;
  title: string;
  note: string | null;
  intensity: number;
  kind?: PreferenceKind;
  category_id?: string | null;
  category_name: string | null;
  category_icon: string | null;
  changed_at?: string | null;
}

/** Anécdota lista para mostrar, con URLs firmadas. */
export interface AnecdoteView {
  id: string;
  title: string;
  body: string | null;
  happened_on: string | null;
  place: string | null;
  mood: string | null;
  photos: string[];
  photoUrls: { full: string; thumb: string }[];
  is_private?: boolean;
}

/** Resultado de get_public_book (ya con URLs firmadas). */
export interface PublicBook {
  person: Pick<Person, "name" | "nickname" | "relationship" | "cover_color" | "avatar_url" | "tagline">;
  avatarSignedUrl?: string | null;
  author: string | null;
  sections: ShareSections;
  likes?: PreferenceView[];
  dislikes?: PreferenceView[];
  anecdotes?: AnecdoteView[];
  dates?: Pick<ImportantDate, "id" | "type" | "label" | "month" | "day" | "year" | "recurring">[];
  gifts?: Pick<GiftIdea, "id" | "title" | "price_estimate" | "url" | "note" | "status">[];
  reminders?: Pick<Reminder, "id" | "title" | "note" | "due_at" | "repeat">[];
}
