import {
  findNetworkBySSID,
  addNetwork,
  setNetworkVariable,
  enableNetwork,
  removeNetwork,
  getConnectedSSID as getCurrentSSID,
} from './utils/cmd';
import { EventEmitter } from 'events';
import { logger } from './utils/logger';

export enum NetworkStatus {
  connected = 'connected',
  disconnected = 'disconnected',
}

/**
 * Represent network
 */
export default class Network extends EventEmitter {
  /**
   * Wifi network interface name
   */
  private ifName: string;

  constructor(ifName: string) {
    super();
    this.ifName = ifName;
  }

  /**
   * Get current connected SSID
   */
  async getConnectedSSID(): Promise<string> {
    return await getCurrentSSID(this.ifName);
  }

  /**
   * Get current network connection status
   */
  async getStatus(): Promise<NetworkStatus> {
    logger.info('get WIFI network connection status');
    const ssid = await this.getConnectedSSID();
    return ssid ? NetworkStatus.connected : NetworkStatus.disconnected;
  }

  /**
   * Compare old status with new status
   * @param oldStatus - old status
   */
  async hasStatusChanged(oldStatus: NetworkStatus): Promise<boolean> {
    logger.info('check if network connection status has changed');
    const newStatus = await this.getStatus();
    return newStatus !== oldStatus;
  }

  /**
   * Configure WIFI network
   * @param ssid - ssid
   * @param pwd - password
   */
  async configureNetwork(ssid: string, pwd: string) {
    logger.info('configure WIFI network', { ssid });
    let networkId: number;
    try {
      const network = await findNetworkBySSID(this.ifName, ssid);

      // Create or Update network
      if (network.networkId) {
        networkId = network.networkId;
      } else {
        networkId = await addNetwork(this.ifName);
      }

      // Set credentials
      await setNetworkVariable(this.ifName, networkId, 'ssid', `'"${ssid}"'`);
      await setNetworkVariable(this.ifName, networkId, 'psk', `'"${pwd}"'`);

      await enableNetwork(this.ifName, networkId);
    } catch (err) {
      // @ts-ignore
      if (networkId) {
        await removeNetwork(this.ifName, networkId);
      }
    }
  }
}
