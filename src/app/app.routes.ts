import { Routes } from '@angular/router';
import { AdminComponent } from './admin/admin.component';
import { ScoreboardComponent } from './scoreboard/scoreboard.component';

export const routes: Routes = [
  { path: '', component: ScoreboardComponent },
  { path: 'admin', component: AdminComponent }
];