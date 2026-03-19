/**
 * Hostinger API Integration Service
 * Handles all interactions with Hostinger API for resource monitoring and management
 */

import { retryIfRetryable } from './retry';

const HOSTINGER_API_BASE_URL = 'https://developers.hostinger.com/api';
const API_TOKEN = process.env.HOSTINGER_API_TOKEN;

export interface HostingerVirtualMachine {
  id: string;
  name: string;
  status: string;
  ipAddress: string;
  cpu: {
    cores: number;
    usage: number;
  };
  memory: {
    total: number;
    used: number;
  };
  storage: {
    total: number;
    used: number;
  };
}

export interface HostingerDomain {
  id: string;
  name: string;
  registrar: string;
  expirationDate: string;
  autoRenewal: boolean;
  status: string;
}

export interface HostingerResourceMetrics {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  bandwidth: number;
}

/**
 * Make authenticated request to Hostinger API
 */
async function makeHostingerRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_TOKEN) {
    throw new Error('HOSTINGER_API_TOKEN is not configured');
  }

  const url = `${HOSTINGER_API_BASE_URL}${endpoint}`;
  
  const result = await retryIfRetryable(
    async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Hostinger API error ${response.status}: ${errorText || response.statusText}`
        );
      }

      return response.json() as Promise<T>;
    },
    {
      maxAttempts: 3,
      initialDelayMs: 500,
      maxDelayMs: 5000,
    }
  );

  if (!result.success) {
    throw result.error || new Error('Failed to call Hostinger API');
  }

  return result.data as T;
}

/**
 * Get list of virtual machines
 */
export async function getVirtualMachines(): Promise<HostingerVirtualMachine[]> {
  try {
    const data = await makeHostingerRequest<{ machines: HostingerVirtualMachine[] }>(
      '/vps/v1/virtual-machines'
    );
    return data.machines || [];
  } catch (error) {
    console.error('[Hostinger] Failed to fetch virtual machines:', error);
    return [];
  }
}

/**
 * Get virtual machine by ID
 */
export async function getVirtualMachine(id: string): Promise<HostingerVirtualMachine | null> {
  try {
    const data = await makeHostingerRequest<HostingerVirtualMachine>(
      `/vps/v1/virtual-machines/${id}`
    );
    return data;
  } catch (error) {
    console.error(`[Hostinger] Failed to fetch virtual machine ${id}:`, error);
    return null;
  }
}

/**
 * Get list of domains
 */
export async function getDomains(): Promise<HostingerDomain[]> {
  try {
    const data = await makeHostingerRequest<{ domains: HostingerDomain[] }>(
      '/domains/v1/domains'
    );
    return data.domains || [];
  } catch (error) {
    console.error('[Hostinger] Failed to fetch domains:', error);
    return [];
  }
}

/**
 * Get domain by ID
 */
export async function getDomain(id: string): Promise<HostingerDomain | null> {
  try {
    const data = await makeHostingerRequest<HostingerDomain>(
      `/domains/v1/domains/${id}`
    );
    return data;
  } catch (error) {
    console.error(`[Hostinger] Failed to fetch domain ${id}:`, error);
    return null;
  }
}

/**
 * Get resource metrics for a virtual machine
 */
export async function getResourceMetrics(vmId: string): Promise<HostingerResourceMetrics | null> {
  try {
    const data = await makeHostingerRequest<HostingerResourceMetrics>(
      `/vps/v1/virtual-machines/${vmId}/metrics`
    );
    return data;
  } catch (error) {
    console.error(`[Hostinger] Failed to fetch metrics for VM ${vmId}:`, error);
    return null;
  }
}

/**
 * Get account information
 */
export async function getAccountInfo(): Promise<any> {
  try {
    const data = await makeHostingerRequest<any>('/account/v1/info');
    return data;
  } catch (error) {
    console.error('[Hostinger] Failed to fetch account info:', error);
    return null;
  }
}

/**
 * Check API connectivity
 */
export async function checkAPIConnectivity(): Promise<boolean> {
  try {
    const machines = await getVirtualMachines();
    return true;
  } catch (error) {
    console.error('[Hostinger] API connectivity check failed:', error);
    return false;
  }
}

/**
 * Get formatted resource usage summary
 */
export async function getResourceSummary(vmId: string): Promise<{
  cpuUsage: string;
  memoryUsage: string;
  storageUsage: string;
} | null> {
  try {
    const vm = await getVirtualMachine(vmId);
    if (!vm) return null;

    return {
      cpuUsage: `${vm.cpu.usage}% (${vm.cpu.cores} cores)`,
      memoryUsage: `${((vm.memory.used / vm.memory.total) * 100).toFixed(1)}% (${vm.memory.used}MB / ${vm.memory.total}MB)`,
      storageUsage: `${((vm.storage.used / vm.storage.total) * 100).toFixed(1)}% (${vm.storage.used}GB / ${vm.storage.total}GB)`,
    };
  } catch (error) {
    console.error('[Hostinger] Failed to get resource summary:', error);
    return null;
  }
}
