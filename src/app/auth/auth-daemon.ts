import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AUTH_HOST } from "../env";
import { ChannelMessageData } from "./auth.model";

export const bootstrapWithFrameWindow = (frameWindow: Window): Promise<void> => {
  return new Promise<void>(resolve => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.key === 'SWIT_AUTH_APP_BOOTSTRAP' && frameWindow === event.source) {
        resolve();
        window.removeEventListener('message', onMessage);
      }
    }
    window.addEventListener('message', onMessage);
  });
}

export const handshakeWithFrameWindow = (frameWindow: Window): Promise<MessagePort> => {
  return new Promise(resolve => {
    const channel = new MessageChannel();
    channel.port1.addEventListener('message', () => {
      resolve(channel.port1);
    });
    channel.port1.start();
    frameWindow.postMessage({
      key: 'SWIT_AUTH_HANDSHAKE_REQUEST'
    }, '*', [channel.port2])
  });
}

@Injectable({
  providedIn: 'root'
})
export class AuthDaemon {

  private static DAEMON_ID = `swit-auth-daemon`;

  private readonly _daemon: HTMLIFrameElement = (() => {
    const exist = document.getElementById(AuthDaemon.DAEMON_ID) as HTMLIFrameElement;
    if (exist) {
      return exist;
    }
    const frame = document.createElement('iframe');
    frame.id = AuthDaemon.DAEMON_ID;
    frame.src = `${AUTH_HOST}/daemon`;
    frame.style.display = `none`;
    document.body.appendChild(frame);
    return frame;
  })();

  private port!: MessagePort;

  public async initialize(): Promise<void> {
    await bootstrapWithFrameWindow(this._daemon.contentWindow!);
    this.port = await handshakeWithFrameWindow(this._daemon.contentWindow!);
    console.log('auth daemon initialized');
  }

  public listen<T>(
    key: string,
    callback: (event: MessageEvent<ChannelMessageData<T>>) => void,
    options?: {
      nonce: string;
    },
  ) {
    const listener = (event: MessageEvent<ChannelMessageData<T>>) => {
      if (event.data?.key !== key) {
        return;
      }
      if (options?.nonce && options.nonce !== event.data?.nonce) {
        return;
      }
      callback(event);
    }
    this.port.addEventListener('message', listener);
    return () => this.port.removeEventListener('message', listener);
  };

  public listen$<T>(
    key: string,
    options?: {
      nonce: string;
    }
  ): Observable<MessageEvent<ChannelMessageData<T>>> {
    return new Observable<MessageEvent<ChannelMessageData<T>>>(
      context => {
        const listener = (event: MessageEvent<ChannelMessageData<T>>) => {
          context.next(event);
        }
        const destroy = this.listen(key, listener, options);
        return () => destroy();
      }
    )
  }

  public post<T>(
    key: string,
    data: T,
    options?: {
      nonce: string;
    },
  ): void {
    this.port.postMessage({
      key: key,
      nonce: options?.nonce,
      data: data,
    });
  };

  public invoke <T, R = T>(
    requestMessageKey: string,
    responseMessageKey: string,
    data?: T,
  ): Promise<MessageEvent<ChannelMessageData<R>>> {
    return new Promise<MessageEvent<ChannelMessageData<R>>>(resolve => {
      const nonce = Math.random().toString();
      const onMessage = (event: MessageEvent<ChannelMessageData<R>>) => {
        if (event.data?.key === responseMessageKey && event.data?.nonce === nonce) {
          resolve(event);
          removeEventListener('message', onMessage);
        }
      }
      this.port.addEventListener('message', onMessage);
      this.port.postMessage({
        key: requestMessageKey,
        nonce: nonce,
        data: data,
      });
    });
  };
}
