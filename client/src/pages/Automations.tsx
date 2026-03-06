import { useState } from "react";
import {
  Avatar,
  Button,
  Chip,
  Description,
  Dropdown,
  Label,
  Modal,
  Separator,
  Switch,
  Tooltip,
  useOverlayState,
} from "@heroui/react";
import {
  CircleFill,
  Clock,
  Ban,
  Check,
  Gear,
  TrashBin,
  Pencil,
} from "@gravity-ui/icons";

// --- Types ---

type AutomationStatus = "active" | "pending" | "inactive" | "error";

interface Integration {
  name: string;
  logo: string;
}

interface Skill {
  name: string;
  logo: string;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  integrations: Integration[];
  skills: Skill[];
  enabled: boolean;
  lastRun?: string;
  version?: string;
}

// --- Mock Data ---

const mockAutomations: Automation[] = [
  {
    id: "1",
    name: "Spec Builder",
    description:
      "Generates detailed technical specifications from project briefs and requirements documents.",
    status: "active",
    integrations: [
      { name: "GitHub", logo: "https://logo.clearbit.com/github.com" },
      { name: "Notion", logo: "https://logo.clearbit.com/notion.so" },
      { name: "Linear", logo: "https://logo.clearbit.com/linear.app" },
    ],
    skills: [
      { name: "OpenAI", logo: "https://logo.clearbit.com/openai.com" },
      { name: "Anthropic", logo: "https://logo.clearbit.com/anthropic.com" },
    ],
    enabled: true,
    lastRun: "2 minutes ago",
    version: "1.2.0",
  },
  {
    id: "2",
    name: "Code Reviewer",
    description:
      "Automatically reviews pull requests for code quality, security issues, and best practices.",
    status: "active",
    integrations: [
      { name: "GitHub", logo: "https://logo.clearbit.com/github.com" },
      { name: "Slack", logo: "https://logo.clearbit.com/slack.com" },
    ],
    skills: [
      { name: "OpenAI", logo: "https://logo.clearbit.com/openai.com" },
      { name: "SonarQube", logo: "https://logo.clearbit.com/sonarsource.com" },
      { name: "ESLint", logo: "https://logo.clearbit.com/eslint.org" },
    ],
    enabled: true,
    lastRun: "15 minutes ago",
    version: "2.0.1",
  },
  {
    id: "3",
    name: "Bug Triager",
    description:
      "Categorizes and prioritizes incoming bug reports based on severity, impact, and affected components.",
    status: "pending",
    integrations: [
      { name: "Jira", logo: "https://logo.clearbit.com/atlassian.com" },
      { name: "Slack", logo: "https://logo.clearbit.com/slack.com" },
      { name: "GitHub", logo: "https://logo.clearbit.com/github.com" },
      { name: "Linear", logo: "https://logo.clearbit.com/linear.app" },
    ],
    skills: [
      { name: "Anthropic", logo: "https://logo.clearbit.com/anthropic.com" },
    ],
    enabled: true,
    lastRun: "1 hour ago",
    version: "0.9.0",
  },
  {
    id: "4",
    name: "Doc Writer",
    description:
      "Creates and maintains API documentation, README files, and developer guides from source code.",
    status: "inactive",
    integrations: [
      { name: "Notion", logo: "https://logo.clearbit.com/notion.so" },
      { name: "GitHub", logo: "https://logo.clearbit.com/github.com" },
    ],
    skills: [
      { name: "OpenAI", logo: "https://logo.clearbit.com/openai.com" },
      { name: "Mintlify", logo: "https://logo.clearbit.com/mintlify.com" },
    ],
    enabled: false,
    lastRun: "3 days ago",
    version: "1.0.0",
  },
  {
    id: "5",
    name: "Deploy Monitor",
    description:
      "Monitors deployment pipelines and alerts the team of failures, rollbacks, or performance regressions.",
    status: "error",
    integrations: [
      { name: "Vercel", logo: "https://logo.clearbit.com/vercel.com" },
      { name: "Slack", logo: "https://logo.clearbit.com/slack.com" },
      { name: "Datadog", logo: "https://logo.clearbit.com/datadoghq.com" },
    ],
    skills: [
      { name: "OpenAI", logo: "https://logo.clearbit.com/openai.com" },
      { name: "PagerDuty", logo: "https://logo.clearbit.com/pagerduty.com" },
      { name: "Grafana", logo: "https://logo.clearbit.com/grafana.com" },
    ],
    enabled: true,
    lastRun: "30 minutes ago",
    version: "1.1.3",
  },
  {
    id: "6",
    name: "Test Generator",
    description:
      "Automatically generates unit and integration tests based on code changes and coverage gaps.",
    status: "active",
    integrations: [
      { name: "GitHub", logo: "https://logo.clearbit.com/github.com" },
    ],
    skills: [
      { name: "Anthropic", logo: "https://logo.clearbit.com/anthropic.com" },
      { name: "Vitest", logo: "https://logo.clearbit.com/vitest.dev" },
    ],
    enabled: true,
    lastRun: "5 minutes ago",
    version: "0.8.2",
  },
];

// --- Status Helpers ---

const statusConfig: Record<
  AutomationStatus,
  {
    label: string;
    color: "success" | "warning" | "default" | "danger";
    icon: React.ReactNode;
  }
> = {
  active: {
    label: "Active",
    color: "success",
    icon: <Check className="size-3" />,
  },
  pending: {
    label: "Pending",
    color: "warning",
    icon: <Clock className="size-3" />,
  },
  inactive: {
    label: "Inactive",
    color: "default",
    icon: <Ban className="size-3" />,
  },
  error: {
    label: "Error",
    color: "danger",
    icon: <CircleFill className="size-2.5" />,
  },
};

// --- Avatar Group Component ---

function AvatarGroup({
  items,
  max = 3,
}: {
  items: { name: string; logo: string }[];
  max?: number;
}) {
  const visible = items.slice(0, max);
  const remaining = items.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((item) => (
        <Tooltip key={item.name} delay={0}>
          <Avatar size="sm" className="ring-2 ring-surface size-7 text-[10px]">
            <Avatar.Image src={item.logo} alt={item.name} />
            <Avatar.Fallback delayMs={300}>
              {item.name.slice(0, 2).toUpperCase()}
            </Avatar.Fallback>
          </Avatar>
          <Tooltip.Content>
            <p className="text-xs">{item.name}</p>
          </Tooltip.Content>
        </Tooltip>
      ))}
      {remaining > 0 && (
        <Tooltip delay={0}>
          <Avatar size="sm" className="ring-2 ring-surface size-7 text-[10px]">
            <Avatar.Fallback>+{remaining}</Avatar.Fallback>
          </Avatar>
          <Tooltip.Content>
            <p className="text-xs">
              {items
                .slice(max)
                .map((i) => i.name)
                .join(", ")}
            </p>
          </Tooltip.Content>
        </Tooltip>
      )}
    </div>
  );
}

// --- Automation Detail Modal ---

function AutomationModal({
  automation,
  state,
}: {
  automation: Automation | null;
  state: ReturnType<typeof useOverlayState>;
}) {
  if (!automation) return null;

  const status = statusConfig[automation.status];

  return (
    <Modal state={state}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{automation.name}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-5">
              {/* Status & Meta */}
              <div className="flex items-center gap-3 flex-wrap">
                <Chip color={status.color} variant="soft" size="sm">
                  <span className="flex items-center gap-1.5">
                    {status.icon}
                    {status.label}
                  </span>
                </Chip>
                {automation.version && (
                  <Chip variant="secondary" size="sm" color="default">
                    v{automation.version}
                  </Chip>
                )}
                {automation.lastRun && (
                  <span className="text-xs text-muted">
                    Last run: {automation.lastRun}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted">{automation.description}</p>
              </div>

              <Separator />

              {/* Integrations */}
              <div>
                <p className="text-sm font-medium mb-2">Integrations</p>
                <div className="flex flex-wrap gap-2">
                  {automation.integrations.map((integration) => (
                    <div
                      key={integration.name}
                      className="flex items-center gap-2 rounded-lg border border-default/40 px-3 py-1.5"
                    >
                      <Avatar size="sm" className="size-5">
                        <Avatar.Image
                          src={integration.logo}
                          alt={integration.name}
                        />
                        <Avatar.Fallback delayMs={300}>
                          {integration.name.slice(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <span className="text-sm">{integration.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-sm font-medium mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {automation.skills.map((skill) => (
                    <div
                      key={skill.name}
                      className="flex items-center gap-2 rounded-lg border border-default/40 px-3 py-1.5"
                    >
                      <Avatar size="sm" className="size-5">
                        <Avatar.Image src={skill.logo} alt={skill.name} />
                        <Avatar.Fallback delayMs={300}>
                          {skill.name.slice(0, 2).toUpperCase()}
                        </Avatar.Fallback>
                      </Avatar>
                      <span className="text-sm">{skill.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Settings */}
              <div>
                <p className="text-sm font-medium mb-3">Settings</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Enabled</p>
                      <p className="text-xs text-muted">
                        Allow this automation to run automatically
                      </p>
                    </div>
                    <Switch defaultSelected={automation.enabled} size="sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm">Notifications</p>
                      <p className="text-xs text-muted">
                        Receive alerts when this automation completes tasks
                      </p>
                    </div>
                    <Switch defaultSelected size="sm" />
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="flex items-center gap-2 justify-between">
              <Button
                variant="tertiary"
                size="sm"
                className="text-danger hover:bg-danger/10"
              >
                <TrashBin className="size-3.5" />
                Delete
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" slot="close">
                  Cancel
                </Button>
                <Button size="sm">
                  <Pencil className="size-3.5" />
                  Edit Automation
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// --- Main Page ---

export default function Automations() {
  const modalState = useOverlayState();
  const [selectedAutomation, setSelectedAutomation] =
    useState<Automation | null>(null);

  const handleRowClick = (automation: Automation) => {
    setSelectedAutomation(automation);
    modalState.open();
  };

  return (
    <div className="flex flex-col gap-4 p-2 h-full overflow-auto bg-surface rounded-2xl shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Automations</h1>
      </div>

      <div className="rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-default/30">
              <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider w-[100px]">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider w-[160px]">
                Name
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider w-[140px]">
                Integrations
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wider w-[140px]">
                Skills
              </th>
            </tr>
          </thead>
          <tbody>
            {mockAutomations.map((automation) => {
              const status = statusConfig[automation.status];
              return (
                <tr
                  key={automation.id}
                  onClick={() => handleRowClick(automation)}
                  className="border-b border-default/20 last:border-b-0 hover:bg-surface-secondary/60 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <Chip color={status.color} variant="soft" size="sm">
                      <span className="flex items-center gap-1.5">
                        {status.icon}
                        {status.label}
                      </span>
                    </Chip>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">
                      {automation.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted line-clamp-1">
                      {automation.description}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <AvatarGroup items={automation.integrations} />
                  </td>
                  <td className="px-4 py-3">
                    <AvatarGroup items={automation.skills} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AutomationModal automation={selectedAutomation} state={modalState} />
    </div>
  );
}
