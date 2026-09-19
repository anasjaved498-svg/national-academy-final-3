import { Announcement, PassingCriterion, Student } from "./types";

// Default passing-percentage settings (editable anytime from Admin → Passing Criteria).
// This is configuration, not demo/dummy content, so it stays.
const criteria: PassingCriterion[] = [
  { testNumber: 1, requiredPercent: 30 },
  { testNumber: 2, requiredPercent: 35 },
  { testNumber: 3, requiredPercent: 40 },
  { testNumber: 4, requiredPercent: 40 },
  { testNumber: 5, requiredPercent: 45 },
];

// No demo students — add real students from Admin → Students.
export const seedStudents: Student[] = [];

// No demo announcements — post real ones from Admin → Announcements.
export const seedAnnouncements: Announcement[] = [];

export const seedCriteria = criteria;

// Exactly 4 testimonial cards so the section isn't empty while real reviews come in.
// Replace/remove any time from Admin → Testimonials.
export const seedQuranReviews = [
  {
    id: "2a4d66c2-7bc2-4f4d-b0d0-1d5f2dc0f001",
    name: "Parent of a Tajweed student",
    role: "Parent",
    review:
      "We can see exactly how our child is doing in Tajweed every month. The graphs make it easy to talk about what to improve.",
    rating: 5,
    approved: true,
    createdAt: "2025-11-20",
  },
  {
    id: "2a4d66c2-7bc2-4f4d-b0d0-1d5f2dc0f002",
    name: "Parent of a Nazra student",
    role: "Parent",
    review:
      "The teacher's attention to correct pronunciation from the very start has made a real difference.",
    rating: 5,
    approved: true,
    createdAt: "2025-12-01",
  },
  {
    id: "2a4d66c2-7bc2-4f4d-b0d0-1d5f2dc0f003",
    name: "Parent of a Qirat student",
    role: "Parent",
    review:
      "Honest, clear results with no inflated grades. We always know exactly where our child stands.",
    rating: 5,
    approved: true,
    createdAt: "2025-12-10",
  },
  {
    id: "2a4d66c2-7bc2-4f4d-b0d0-1d5f2dc0f004",
    name: "Parent of two students",
    role: "Parent",
    review:
      "Having both kids' progress in one portal has made it so much easier to stay involved in their Quran studies.",
    rating: 5,
    approved: true,
    createdAt: "2025-12-15",
  },
];
