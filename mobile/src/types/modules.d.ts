declare module 'react-native-sqlite-storage' {
  export interface ResultSet {
    rows: {
      length: number;
      item(index: number): any;
    };
  }

  export interface Transaction {
    executeSql(sql: string, params?: any[]): void;
  }

  export interface SQLiteDatabase {
    executeSql(sql: string, params?: any[]): Promise<[ResultSet]>;
    transaction(fn: (tx: Transaction) => Promise<void>): Promise<void>;
    close(): Promise<void>;
  }

  interface OpenDatabaseParams {
    name: string;
    location?: string;
  }

  interface SQLiteStatic {
    enablePromise(enable: boolean): void;
    openDatabase(params: OpenDatabaseParams): Promise<SQLiteDatabase>;
  }

  const SQLite: SQLiteStatic;
  export default SQLite;
}

declare module 'react-native-push-notification' {
  export interface PushNotificationScheduleObject {
    channelId?: string;
    date: Date;
    message: string;
    title?: string;
    userInfo?: Record<string, any>;
    allowWhileIdle?: boolean;
    id?: number;
    soundName?: string;
    importance?: string;
    priority?: string;
    vibrate?: boolean;
    vibration?: number;
    repeatType?: 'day' | 'week' | 'month' | 'year' | 'time';
  }

  export interface PushNotificationObject {
    channelId?: string;
    message: string;
    title?: string;
    soundName?: string;
    importance?: string;
    priority?: string;
    userInfo?: Record<string, any>;
  }

  export interface ReceivedNotification {
    data?: Record<string, any>;
    finish: (result: string) => void;
    [key: string]: any;
  }

  interface ConfigureOptions {
    onRegister?: (token: { os: string; token: string }) => void;
    onNotification?: (notification: ReceivedNotification) => void;
    permissions?: { alert?: boolean; badge?: boolean; sound?: boolean };
    popInitialNotification?: boolean;
    requestPermissions?: boolean;
  }

  interface ChannelOptions {
    channelId: string;
    channelName: string;
    channelDescription?: string;
    soundName?: string;
    importance?: number;
    vibrate?: boolean;
  }

  interface PushNotificationStatic {
    configure(options: ConfigureOptions): void;
    createChannel(channel: ChannelOptions, callback: (created: boolean) => void): void;
    localNotification(notification: PushNotificationObject): void;
    localNotificationSchedule(notification: PushNotificationScheduleObject): void;
    cancelAllLocalNotifications(): void;
    cancelLocalNotifications(details: { id: string }): void;
  }

  const PushNotification: PushNotificationStatic;
  export default PushNotification;
}
