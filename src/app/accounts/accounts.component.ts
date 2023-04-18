import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { from, fromEvent, shareReplay, SubscriptionLike, switchMap, tap } from "rxjs";
import { bootstrapWithFrameWindow, handshakeWithFrameWindow } from "../auth/auth-daemon";
import { ChannelMessageData } from "../auth/auth.model";
import { AUTH_HOST } from "../env";

@Component({
  selector: 'swit-accounts',
  template: `
    <iframe #frame style="height: 800px;" src="${AUTH_HOST}/account-management"></iframe>
  `,
  standalone: true,
})
export class AccountsComponent implements OnInit, OnDestroy {
  private readonly _subscriptions: SubscriptionLike[] = [];

  public static ON_ADD_ORGANIZATION = `SWIT_AUTH_MANAGEMENT_ADD_ORGANIZATION_CLICK`;
  public static ON_CLEAR_ACCOUNTS = `SWIT_AUTH_MANAGEMENT_CLEAR_ACCOUNTS_CLICK`;

  @ViewChild('frame', { static: true })
  public readonly frame!: ElementRef<HTMLIFrameElement>;

  public  ngOnInit(): void {
    const window = this.frame.nativeElement.contentWindow!;

    const onMessage$ = from(bootstrapWithFrameWindow(window)).pipe(
      switchMap(() => from(handshakeWithFrameWindow(window)).pipe(
        switchMap((port) => fromEvent<MessageEvent<ChannelMessageData<unknown>>>(port, 'message'))
      )),
      shareReplay(1),
    );

    this._subscriptions.push(
      onMessage$.pipe(
        tap((event) => {
          switch (event.data.key) {
            case AccountsComponent.ON_ADD_ORGANIZATION:
              this.onAddOrganizationClick(event as MessageEvent<ChannelMessageData<void>>);
              break;
            case AccountsComponent.ON_CLEAR_ACCOUNTS:
              this.onClearAccountsClick(event as MessageEvent<ChannelMessageData<void>>);
              break;
          }
        }),
      ).subscribe(),
    );
  }

  public onAddOrganizationClick(
    event: MessageEvent<ChannelMessageData<void>>
  ): void {
    location.href = `${AUTH_HOST}/oauth/sign-in/organization?redirectUri=${encodeURIComponent(location.href)}`;
  }

  public onClearAccountsClick(
    event: MessageEvent<ChannelMessageData<void>>
  ): void {
    console.log('cleared');
  }

  public ngOnDestroy(): void {
    this._subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
