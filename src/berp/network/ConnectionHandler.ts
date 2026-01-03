import { EventEmitter } from 'events'
import { Client, createClient } from 'bedrock-protocol'
import { Logger } from '../../console'
import { ConnectionManager } from './ConnectionManager'
import {
  ActivePlugin,
  RealmAPIWorld,
  XboxProfile,
} from 'src/types/berp'
import { BeRP } from '..'
import { CUR_VERSION } from '../../Constants'
import { packet_add_entity } from '../../types/packets.i';
import { PlayerRecords } from '../../types/packetTypes.i';

/**
 * Thin wrapper around bedrock-protocol's Client to preserve the
 * ConnectionHandler surface expected by the existing plugin API.
 */
export class ConnectionHandler extends EventEmitter {
  public readonly host: string
  public readonly port: number
  public readonly realm: RealmAPIWorld
  public readonly id: number
  public playerQue: any[] = []
  private _tickSync = 0n
  private _connectionManager: ConnectionManager
  private _log: Logger
  private _plugins = new Map<string, ActivePlugin>()
  private _berp: BeRP
  private _client: Client
  private _profile: XboxProfile

  constructor(host: string, port: number, realm: RealmAPIWorld, cm: ConnectionManager, berp: BeRP) {
    super()
    this.host = host
    this.port = port
    this.realm = realm
    this.id = realm.id
    this._connectionManager = cm
    this._berp = berp
    this._log = new Logger(`Connection Handler (${cm.getAccount().username}:${realm.id})`, 'cyanBright')

    this.setMaxListeners(Infinity)
    this._log.success('Initialized')
  }

  public getGameInfo(): any { return undefined }
  public getLogger(): Logger { return this._log }
  public getTick(): bigint { return this._tickSync }
  public getConnectionManager(): ConnectionManager { return this._connectionManager }
  public getClient(): Client { return this._client }
  public getXboxProfile(): XboxProfile { return this._profile }
  public getRakLogger(): Logger { return this._log }

  public connect(): void {
    this._client = createClient({
      host: this.host,
      port: this.port,
      version: CUR_VERSION as any,
      offline: false,
      raknetBackend: 'raknet-native',
      username: this._connectionManager.getAccount()?.username || 'BeRP',
      conLog: () => undefined,
    })

    this._client.on('packet', (des: any) => {
      const { name, params } = des.data
      if (name === 'tick_sync') {
        this._tickSync = params.response_time ?? 0n
      }
      this.emit(name, params)
    })

    this._client.on('start_game', (pak) => {
      this._profile = (this._client as any).profile as XboxProfile
      this.emit('rak_ready')
      this._registerPlugins()
    })

    this._client.on('player_list', (packet) => {
      this._playerQue(packet)
    })

    this._client.on('disconnect', (reason) => {
      this._handleDisconnect(reason?.message || 'Disconnected')
    })

    this._client.on('close', () => {
      this._handleDisconnect('Connection closed')
    })

    this._client.on('spawn', () => {
      this.emit('rak_ready')
    })
  }

  public close(): void {
    this._client?.close()
    this.removeAllListeners()
    this._connectionManager.getConnections().delete(this.realm.id)
  }

  public sendCommandFeedback(option: boolean): void {
    this.sendPacket('command_request', {
      command: `gamerule sendcommandfeedback ${option}`,
      interval: false,
      origin: {
        uuid: '',
        request_id: '',
        type: 'player',
      },
    })
  }

  public async sendPacket(name: string, params: Record<string, any>): Promise<{ name: string, params: Record<string, any> }> {
    this._client.queue(name, params)
    return { name, params }
  }

  private _playerQue(pak?: any) {
    if (!pak?.records?.records) return
    for (const record of pak.records.records) {
      if (this._profile && record.username == this._profile?.extraData?.displayName) continue
      this.playerQue.push(record)
    }
  }

  private async packet_add_entity(pak?: any): Promise<void> {
    if (!pak?.records?.records) return
    // to be finished
    // adding packets asyncronously
  }


  private async _handleDisconnect(reason: string): Promise<void> {
    await this._berp.getPluginManager().killPlugins(this)
    this.close()
    this._log.warn(`Terminating connection handler with connection "${this.host}:${this.port}"`)
    this._log.warn('Disconnection on', `${this.host}:${this.port}`, `"${reason}"`)
  }

  private async _registerPlugins(): Promise<void> {
    const plugins = await this._berp.getPluginManager().registerPlugins(this)
    for (const plugin of plugins) {
      this._plugins.set(plugin.config.name, plugin)
    }
  }
  public getPlugins(): Map<string, ActivePlugin> { return this._plugins }
}
