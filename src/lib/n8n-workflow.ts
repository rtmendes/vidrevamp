import type { WorkflowPlan } from '@/actions/automations';

/**
 * Converts a VidRevamp WorkflowPlan into a valid n8n workflow JSON
 * ready to import via the n8n UI or deploy via the REST API.
 */
export function buildN8nWorkflow(plan: WorkflowPlan): object {
  const nodes: object[] = [];
  const connections: Record<string, object> = {};

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

  plan.steps.forEach((step, i) => {
    const nodeName = step.name;
    const x = 250 + (i + 1) * 220;
    nodes.push({
      id: `step-${step.id}`,
      name: nodeName,
      type: step.n8nNodeType || 'n8n-nodes-base.httpRequest',
      typeVersion: step.n8nNodeType === 'n8n-nodes-base.httpRequest' ? 4.2 : 1,
      position: [x, 300],
      parameters: { notes: step.description },
    });

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
