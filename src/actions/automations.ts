'use server';

import OpenAI from 'openai';

// ── AI client (same pattern as ai-scripts.ts) ─────────────────────────────────

function getClient(): OpenAI {
  // prefer OpenRouter for flexibility; fall back to direct OpenAI
  if (process.env.OPENROUTER_API_KEY) {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://sandcastles-clone.vercel.app',
        'X-Title': 'VidRevamp',
      },
    });
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

const MODEL = process.env.OPENROUTER_API_KEY
  ? 'anthropic/claude-3.5-sonnet'
  : 'gpt-4o-mini';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  tool: string;       // human-readable: "YouTube API", "Claude AI", "Email", "Slack", etc.
  n8nNodeType: string; // e.g. "n8n-nodes-base.httpRequest"
}

export interface WorkflowPlan {
  name: string;
  description: string;
  trigger: {
    type: 'schedule' | 'webhook' | 'manual' | 'event';
    label: string;
    cronExpression?: string;   // only for schedule
    webhookPath?: string;      // only for webhook
  };
  steps: WorkflowStep[];
  estimatedRuntime: string;    // e.g. "~45 seconds per run"
  estimatedCostPerRun: string; // e.g. "$0.003"
  suggestedCronPreset?: string; // human-readable schedule suggestion
}

// ── Generate Workflow Plan ────────────────────────────────────────────────────

export async function generateWorkflowPlan(
  description: string
): Promise<{ success: boolean; data?: WorkflowPlan; error?: string }> {
  try {
    const client = getClient();

    const systemPrompt = `You are an expert automation engineer for YouTube content creators.
Your job is to turn plain-English automation requests into structured workflow plans that can be executed by n8n.

Return ONLY valid JSON with this exact structure — no markdown fences, no extra text:
{
  "name": "Short workflow name (max 40 chars)",
  "description": "One sentence describing what this automation does",
  "trigger": {
    "type": "schedule" | "webhook" | "manual" | "event",
    "label": "Human-readable trigger description",
    "cronExpression": "cron expression if schedule, e.g. 0 9 * * *",
    "webhookPath": "/webhook/my-workflow if webhook type"
  },
  "steps": [
    {
      "id": 1,
      "name": "Step name",
      "description": "What this step does in one sentence",
      "tool": "Tool/service used: YouTube API | Claude AI | Gmail | Slack | HTTP Request | Supabase | OpenAI | Airtable | Google Sheets | Telegram | Discord | RSS | etc.",
      "n8nNodeType": "n8n node type, e.g. n8n-nodes-base.httpRequest"
    }
  ],
  "estimatedRuntime": "~30 seconds per run",
  "estimatedCostPerRun": "$0.002",
  "suggestedCronPreset": "Every day at 9am"
}

Design practical, efficient workflows. Max 7 steps. Keep step descriptions clear and actionable.
For YouTube monitoring tasks, use HTTP Request nodes to call YouTube Data API v3.
For AI tasks, use HTTP Request to call OpenAI/Claude APIs or use built-in AI Transform nodes.
For notifications, use Gmail, Slack, Discord, or Telegram nodes.`;

    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create an automation workflow for: ${description}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    // Strip any accidental markdown fences
    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const plan: WorkflowPlan = JSON.parse(jsonStr);

    return { success: true, data: plan };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate workflow plan',
    };
  }
}

// ── Build n8n Workflow JSON ───────────────────────────────────────────────────
// Converts a WorkflowPlan into a valid n8n workflow JSON ready to import/deploy

export function buildN8nWorkflow(plan: WorkflowPlan): object {
  const nodes: object[] = [];
  const connections: Record<string, object> = {};

  // Trigger node
  const triggerNodeName = 'Trigger';
  if (plan.trigger.type === 'schedule' && plan.trigger.cronExpression) {
    nodes.push({
      id: 'trigger-node',
      name: triggerNodeName,
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.2,
      position: [250, 300],
      parameters: {
        rule: {
          interval: [{ field: 'cronExpression', expression: plan.trigger.cronExpression }],
        },
      },
    });
  } else if (plan.trigger.type === 'webhook') {
    nodes.push({
      id: 'trigger-node',
      name: triggerNodeName,
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [250, 300],
      parameters: {
        path: plan.trigger.webhookPath ?? '/webhook/vidrevamp',
        httpMethod: 'POST',
      },
    });
  } else {
    nodes.push({
      id: 'trigger-node',
      name: triggerNodeName,
      type: 'n8n-nodes-base.manualTrigger',
      typeVersion: 1,
      position: [250, 300],
      parameters: {},
    });
  }

  // Step nodes
  plan.steps.forEach((step, i) => {
    const nodeName = step.name;
    const x = 250 + (i + 1) * 220;
    nodes.push({
      id: `step-${step.id}`,
      name: nodeName,
      type: step.n8nNodeType || 'n8n-nodes-base.httpRequest',
      typeVersion: step.n8nNodeType === 'n8n-nodes-base.httpRequest' ? 4.2 : 1,
      position: [x, 300],
      parameters: {
        // Placeholder parameters — user fills these in n8n after import
        notes: step.description,
      },
    });

    // Connect: previous node → this node
    const prevName = i === 0 ? triggerNodeName : plan.steps[i - 1].name;
    connections[prevName] = {
      main: [[{ node: nodeName, type: 'main', index: 0 }]],
    };
  });

  return {
    name: plan.name,
    nodes,
    connections,
    active: false,
    settings: { executionOrder: 'v1' },
    tags: [{ name: 'VidRevamp' }],
  };
}

// ── n8n API integration ───────────────────────────────────────────────────────

export async function testN8nConnection(
  n8nUrl: string,
  apiKey: string
): Promise<{ success: boolean; version?: string; instanceName?: string; error?: string }> {
  try {
    const base = n8nUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/api/v1/workflows?limit=1`, {
      headers: { 'X-N8N-API-KEY': apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body?.message ?? `HTTP ${res.status}` };
    }
    // Try to get version info
    const versionRes = await fetch(`${base}/api/v1/`, {
      headers: { 'X-N8N-API-KEY': apiKey },
    }).catch(() => null);
    const versionData = versionRes ? await versionRes.json().catch(() => null) : null;
    return {
      success: true,
      version: versionData?.n8nVersion ?? 'unknown',
      instanceName: versionData?.instanceId ?? base,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

export async function deployToN8n(
  plan: WorkflowPlan,
  n8nUrl: string,
  apiKey: string
): Promise<{ success: boolean; workflowId?: string; workflowUrl?: string; error?: string }> {
  try {
    const base = n8nUrl.replace(/\/$/, '');
    const workflowJson = buildN8nWorkflow(plan);

    const res = await fetch(`${base}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workflowJson),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { success: false, error: body?.message ?? `HTTP ${res.status}: Failed to create workflow` };
    }

    const created = await res.json();
    return {
      success: true,
      workflowId: created.id,
      workflowUrl: `${base}/workflow/${created.id}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed',
    };
  }
}

export async function getN8nExecutions(
  n8nUrl: string,
  apiKey: string,
  limit = 10
): Promise<{ success: boolean; data?: { id: string; status: string; startedAt: string; stoppedAt?: string; workflowName?: string }[]; error?: string }> {
  try {
    const base = n8nUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/api/v1/executions?limit=${limit}&includeData=false`, {
      headers: { 'X-N8N-API-KEY': apiKey },
    });
    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return {
      success: true,
      data: (data.data ?? []).map((e: { id: string; status: string; startedAt: string; stoppedAt?: string; workflowData?: { name?: string } }) => ({
        id: e.id,
        status: e.status,
        startedAt: e.startedAt,
        stoppedAt: e.stoppedAt,
        workflowName: e.workflowData?.name,
      })),
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch executions' };
  }
}
