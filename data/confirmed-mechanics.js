// Qualitative guidance only. Corroborated separately from the non-runtime client research dataset.
const beginnerGuide = {
  kind: 'community-guide',
  title: 'Resurgence Builds · Beginner Guide (October 2026)',
  url: 'https://resurgencebuilds.com/guides/division-resurgence-beginner-guide/',
};

export const confirmedMechanics = [
  {
    id: 'armory-proficiency',
    title: 'Progress your weapon proficiency',
    body: 'Complete weapon-specific proficiency tasks in the Armory to advance weapon proficiency and earn attribute boosts and rewards.',
    status: 'source-checked-qualitative',
    notForCalculations: true,
    checkedOn: '2026-10-30',
    clientEvidence: { version: '1.66724.0', researchId: 'armory-proficiency' },
    sources: [
      {
        kind: 'official',
        title: 'Ubisoft · Armory Rework (November 2023 beta diary)',
        url: 'https://www.ubisoft.com/en-us/game/the-division/resurgence/news-updates/6MPDW2GKm4TN9GaBE4n7GJ/dev-diary-regional-beta-2-updates-new-features',
        excerpt: 'Completing proficiency tasks for each weapon will increase the proficiency level of the corresponding weapon and will unlock weapon attribute boosts as well as other rewards.',
        historical: true,
      },
      {
        ...beginnerGuide,
        excerpt: 'Every weapon model has a proficiency track in the Armory, with challenges like kill counts and weak-point hits.',
      },
    ],
  },
  {
    id: 'armor-weaknesses',
    title: 'Match weapon types to armor weaknesses',
    body: 'Enemy armor weakness indicators show which weapon damage type to use. Adapt your loadout to the enemy’s weakness.',
    status: 'source-checked-qualitative',
    notForCalculations: true,
    checkedOn: '2026-10-30',
    clientEvidence: { version: '1.66724.0', researchId: 'armor-weaknesses' },
    sources: [
      {
        kind: 'official',
        title: 'Ubisoft · Damage types (June 2023 preview)',
        url: 'https://news.ubisoft.com/en-us/article/6Jn7afkUJmUJR14VMbv5VK/the-division-resurgence-amps-up-specializations-launch-slated-for-fall-2023',
        excerpt: 'you’ll be able to spot the colored armor bars on enemies that indicate what damage they are weak to',
        historical: true,
      },
      {
        ...beginnerGuide,
        excerpt: 'Weapons deal one of three damage types: Blast, Shredding or Piercing. Ubisoft’s 2023 preview says the colored armor bars on enemies show what damage they’re weak to',
      },
    ],
  },
  {
    id: 'specialization-xp',
    title: 'Track specialization progression separately',
    body: 'Character XP raises your character level. Specialization XP progresses an individual specialization on its own track.',
    status: 'source-checked-qualitative',
    notForCalculations: true,
    checkedOn: '2026-10-30',
    clientEvidence: { version: '1.66724.0', researchId: 'specialization-xp' },
    sources: [
      {
        kind: 'official',
        title: 'The Division Resurgence · Separate XP types (June 2026 announcement)',
        url: 'https://x.com/TheDivMobile/status/2065464140706038216',
        excerpt: 'This weekend, regular and Specialization XP is doubled!',
        historical: true,
      },
      {
        kind: 'community-guide',
        title: 'Resurgence Builds · Specialization progression (October 2026)',
        url: 'https://resurgencebuilds.com/guides/which-specialization-to-pick/',
        excerpt: 'Your focus progress and chipset unlocks are tied to the individual specialization, not a global character level.',
      },
    ],
  },
];
