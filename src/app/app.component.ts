import { Component,  OnInit  } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TeamBoardComponent } from "./team-board/team-board.component";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TeamBoardComponent],
  providers: [HttpClient],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {

  scores: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('assets/scores.json').subscribe(json => {
        this.scores = json;
      });
  }

}
