import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { AuthDaemon } from "./auth-daemon";
import { SwitAccount } from "./auth.model";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _daemon = inject(AuthDaemon);

  public account: SwitAccount | null = null;

  public async initialize() {
    const account = await this.getCurrentAccount();
    this.account = account;
    this.currentAccountChange$().subscribe((account) => this.account = account);
    console.log('auth service initialized');
  }

  public async getCurrentAccount(): Promise<SwitAccount> {
    return this._daemon.invoke<void, SwitAccount>(
      'SWIT_AUTH_GET_SIGNED_ACCOUNT',
      'SWIT_AUTH_GET_SIGNED_ACCOUNT_RESPONSE'
    ).then((event) => event.data.data);
  }

  public async getAccounts(): Promise<SwitAccount[]> {
    return this._daemon.invoke<void, SwitAccount[]>(
      'SWIT_AUTH_GET_SIGNED_ACCOUNT',
      'SWIT_AUTH_GET_SIGNED_ACCOUNT_RESPONSE'
    ).then((event) => event.data.data);
  }

  public signOut(): void {
    this._daemon.post<void>(
      `SWIT_AUTH_SIGN_OUT`,
      undefined,
    );
  }

  public currentAccountChange$(): Observable<SwitAccount | null> {
    return this._daemon.listen$<SwitAccount | null>('AUTH_CURRENT_ACCOUNT_CHANGE').pipe(
      map((event) => event.data.data),
    )
  }

}
