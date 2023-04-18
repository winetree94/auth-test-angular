import { Component, inject } from '@angular/core';
import { AuthService } from './auth/auth-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  public readonly auth = inject(AuthService);

  public ui = false;

  public signIn(): void {
    location.href = `https://local.swit.dev:1201/oauth/sign-in/organization?redirectUri=${encodeURIComponent(location.href)}`;
  }
}
