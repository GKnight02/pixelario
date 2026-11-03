import type { Metadata } from "next";
import { RemindersList } from "@/components/book/chapters/reminders";
import { getProfile } from "@/lib/auth";
import { getPeopleOptions, getReminders } from "@/lib/data";

export const metadata: Metadata = { title: "Recordatorios" };

export default async function RemindersPage() {
  const [items, people, profile] = await Promise.all([getReminders(), getPeopleOptions(), getProfile()]);
  return (
    <div className="pixel-border paper mx-auto w-full max-w-3xl p-4 sm:p-6">
      <RemindersList
        items={items}
        people={people}
        timezone={profile.timezone}
        defaultChannels={profile.default_reminder_channels}
        now={new Date().toISOString()}
        editable
        global
      />
    </div>
  );
}
