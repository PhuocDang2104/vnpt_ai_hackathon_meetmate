// ============================================
// ITEMS API (Actions, Decisions, Risks)
// ============================================

import api from '../apiClient';

// Action Items
export interface ActionItem {
  id: string;
  meeting_id: string;
  owner_user_id?: string;
  owner_name?: string;
  description: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'confirmed';
  source_text?: string;
  created_at: string;
  updated_at: string;
}

export interface ActionItemList {
  items: ActionItem[];
  total: number;
}

// Decisions
export interface DecisionItem {
  id: string;
  meeting_id: string;
  description: string;
  rationale?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  source_text?: string;
  created_at: string;
  updated_at: string;
}

export interface DecisionItemList {
  items: DecisionItem[];
  total: number;
}

// Risks
export interface RiskItem {
  id: string;
  meeting_id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation?: string;
  status: 'identified' | 'mitigated' | 'in_progress';
  source_text?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskItemList {
  items: RiskItem[];
  total: number;
}

const ENDPOINT = '/items';

export const itemsApi = {
  // Action Items
  listActions: async (meetingId: string): Promise<ActionItemList> => {
    return api.get<ActionItemList>(`${ENDPOINT}/actions/${meetingId}`);
  },

  getAction: async (itemId: string): Promise<ActionItem> => {
    return api.get<ActionItem>(`${ENDPOINT}/actions/item/${itemId}`);
  },

  // Decisions
  listDecisions: async (meetingId: string): Promise<DecisionItemList> => {
    return api.get<DecisionItemList>(`${ENDPOINT}/decisions/${meetingId}`);
  },

  getDecision: async (itemId: string): Promise<DecisionItem> => {
    return api.get<DecisionItem>(`${ENDPOINT}/decisions/item/${itemId}`);
  },

  // Risks
  listRisks: async (meetingId: string): Promise<RiskItemList> => {
    return api.get<RiskItemList>(`${ENDPOINT}/risks/${meetingId}`);
  },

  getRisk: async (itemId: string): Promise<RiskItem> => {
    return api.get<RiskItem>(`${ENDPOINT}/risks/item/${itemId}`);
  },
};

export default itemsApi;

