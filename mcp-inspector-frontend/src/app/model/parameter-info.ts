/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ParameterInfo {
  name: string;
  type: string;
  description: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
  enum?: any[];
  default?: any;
}
