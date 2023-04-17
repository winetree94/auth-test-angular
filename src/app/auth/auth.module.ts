import { APP_INITIALIZER, inject, ModuleWithProviders, NgModule } from "@angular/core";
import { AuthDaemon } from "./auth-daemon";
import { AuthService } from "./auth-service";

@NgModule()
export class AuthModule {

  public static forRoot(): ModuleWithProviders<AuthModule> {
    return {
     ngModule: AuthModule ,
     providers: [
      {
        provide: APP_INITIALIZER,
        multi: true,
        useFactory: () => {
          const daemon = inject(AuthDaemon);
          const service = inject(AuthService);
          return () =>  daemon.initialize().then(
            () => service.initialize()
          );
        },
      },
     ]
    }
  }
}
