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
  public accounts: SwitAccount[] = [];

  public async initialize() {
    const account = await this.getCurrentAccount();
    const accounts = await this.getAccounts();
    this.account = account;
    this.accounts = accounts;
    this.currentAccountChange$().subscribe((account) => this.account = account);
    this.accountsChange$().subscribe((accounts) => this.accounts = accounts);
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
      'SWIT_AUTH_GET_ACCOUNTS',
      'SWIT_AUTH_GET_ACCOUNTS_RESPONSE'
    ).then((event) => event.data.data);
  }

  public signOut(): void {
    this._daemon.post<void>(
      `SWIT_AUTH_SIGN_OUT`,
      undefined,
    );
  }

  public currentAccountChange$(): Observable<SwitAccount | null> {
    return this._daemon.listen$<SwitAccount | null>('SWIT_AUTH_CURRENT_ACCOUNT_CHANGE').pipe(
      map((event) => event.data.data),
    )
  }

  public accountsChange$(): Observable<SwitAccount[]> {
    return this._daemon.listen$<SwitAccount[]>('SWIT_AUTH_ACCOUNTS_CHANGE').pipe(
      map((event) => event.data.data),
    )
  }

}
