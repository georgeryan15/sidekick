import { useState } from "react";
import { Avatar, Button, SearchField } from "@heroui/react";

// --- Types ---

type SkillCategory =
  | "All Skills"
  | "Communication"
  | "CRM"
  | "Development"
  | "Analytics"
  | "Productivity"
  | "Marketing"
  | "Support";

type SkillSource = "Official" | "Community";

interface Skill {
  id: string;
  name: string;
  subtitle: string;
  author: string;
  source: SkillSource;
  icon: string;
  category: SkillCategory;
}

// --- Mock Data ---

const mockSkills: Skill[] = [
  {
    id: "1",
    name: "Slack Notifier",
    subtitle: "Send smart notifications",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/slack.com",
    category: "Communication",
  },
  {
    id: "2",
    name: "Email Drafter",
    subtitle: "AI-powered email composition",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/gmail.com",
    category: "Communication",
  },
  {
    id: "3",
    name: "Teams Connector",
    subtitle: "Microsoft Teams integration",
    author: "Community Labs",
    source: "Community",
    icon: "https://logo.clearbit.com/microsoft.com",
    category: "Communication",
  },
  {
    id: "4",
    name: "Salesforce Sync",
    subtitle: "Bi-directional CRM sync",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/salesforce.com",
    category: "CRM",
  },
  {
    id: "5",
    name: "HubSpot Manager",
    subtitle: "Manage deals & contacts",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/hubspot.com",
    category: "CRM",
  },
  {
    id: "6",
    name: "Pipedrive Helper",
    subtitle: "Pipeline automation",
    author: "DevForge",
    source: "Community",
    icon: "https://logo.clearbit.com/pipedrive.com",
    category: "CRM",
  },
  {
    id: "7",
    name: "GitHub Actions",
    subtitle: "CI/CD workflow automation",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/github.com",
    category: "Development",
  },
  {
    id: "8",
    name: "Code Reviewer",
    subtitle: "Automated PR reviews",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/sonarsource.com",
    category: "Development",
  },
  {
    id: "9",
    name: "Docker Deploy",
    subtitle: "Container management",
    author: "CloudCraft",
    source: "Community",
    icon: "https://logo.clearbit.com/docker.com",
    category: "Development",
  },
  {
    id: "10",
    name: "Mixpanel Tracker",
    subtitle: "Event analytics tracking",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/mixpanel.com",
    category: "Analytics",
  },
  {
    id: "11",
    name: "Google Analytics",
    subtitle: "Traffic & conversion insights",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/google.com",
    category: "Analytics",
  },
  {
    id: "12",
    name: "Amplitude Reports",
    subtitle: "Product analytics reports",
    author: "DataWiz",
    source: "Community",
    icon: "https://logo.clearbit.com/amplitude.com",
    category: "Analytics",
  },
  {
    id: "13",
    name: "Notion Sync",
    subtitle: "Workspace synchronization",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/notion.so",
    category: "Productivity",
  },
  {
    id: "14",
    name: "Linear Tasks",
    subtitle: "Issue tracking automation",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/linear.app",
    category: "Productivity",
  },
  {
    id: "15",
    name: "Todoist Planner",
    subtitle: "Smart task planning",
    author: "TaskMaster",
    source: "Community",
    icon: "https://logo.clearbit.com/todoist.com",
    category: "Productivity",
  },
  {
    id: "16",
    name: "Mailchimp Sender",
    subtitle: "Campaign automation",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/mailchimp.com",
    category: "Marketing",
  },
  {
    id: "17",
    name: "SEO Analyzer",
    subtitle: "On-page SEO optimization",
    author: "GrowthKit",
    source: "Community",
    icon: "https://logo.clearbit.com/semrush.com",
    category: "Marketing",
  },
  {
    id: "18",
    name: "Social Poster",
    subtitle: "Multi-platform publishing",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/buffer.com",
    category: "Marketing",
  },
  {
    id: "19",
    name: "Zendesk Agent",
    subtitle: "Ticket auto-response",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/zendesk.com",
    category: "Support",
  },
  {
    id: "20",
    name: "Intercom Bot",
    subtitle: "Live chat assistant",
    author: "Sidekick",
    source: "Official",
    icon: "https://logo.clearbit.com/intercom.com",
    category: "Support",
  },
  {
    id: "21",
    name: "Freshdesk Helper",
    subtitle: "Support ticket triage",
    author: "SupportHero",
    source: "Community",
    icon: "https://logo.clearbit.com/freshworks.com",
    category: "Support",
  },
];

// --- Main Page ---

export default function Skills() {
  const [query, setQuery] = useState("");

  const filteredSkills = query
    ? mockSkills.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          s.author.toLowerCase().includes(query.toLowerCase())
      )
    : mockSkills;

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
      {/* Search bar */}
      <div className="flex justify-end">
        <SearchField value={query} onChange={setQuery}>
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input className="w-[240px]" placeholder="Search skills..." />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>
      </div>

      {/* Skills Grid - 2 columns, 3 rows like App Store */}
      <div className="grid grid-cols-2 gap-x-8">
        {filteredSkills.map((skill, index) => (
          <div
            key={skill.id}
            className={`flex items-center gap-4 py-4 ${
              index < filteredSkills.length - 2 ? "border-b border-neutral-100" : ""
            }`}
          >
            {/* Icon */}
            <Avatar className="size-14 rounded-2xl shrink-0" size="lg">
              <Avatar.Image
                src="https://images.ctfassets.net/y2vv62dcl0ut/1V2Y6OfgpE9gl28aou4aud/f9b6cdd37ed41719bd3a8e383a87f21e/Freddy-Icon-512-8bit.png"
                alt={skill.name}
              />
              <Avatar.Fallback
                delayMs={300}
                className="rounded-xl bg-neutral-100 text-sm"
              >
                {skill.name.slice(0, 2).toUpperCase()}
              </Avatar.Fallback>
            </Avatar>

            {/* Info */}
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-neutral-400 font-medium">
                {skill.author}
              </span>
              <span className="text-sm font-semibold truncate">
                {skill.name}
              </span>
              <span className="text-xs text-neutral-400 truncate">
                {skill.subtitle}
              </span>
            </div>

            {/* Source Badge + Get Button */}
            <div className="flex items-center gap-3 shrink-0">
              <Button size="sm" variant="primary" className="rounded-full px-5">
                Get
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
