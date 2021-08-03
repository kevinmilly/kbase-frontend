import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, Subscription } from 'rxjs';
import { SubSink } from 'subsink';
import { IConcept } from '../core/models/interfaces/concepts.model';
import { IControlModel } from '../core/models/interfaces//control.model';
import { BackendService } from '../core/services/backend.service';
import { ConceptDetailComponent } from './concept-detail/concept-detail.component';

import { NgxSpinnerService } from "ngx-spinner";
import { MatSnackBar } from '@angular/material/snack-bar';
import { GamificationServiceService } from '../core/services/gamification-service.service';
import { MediaObserver, MediaChange } from '@angular/flex-layout';
import { PopupExampleComponent } from '../shared/components/popup-example/popup-example.component';
import { Level, Necessity, Tag } from '../core/models/enums/factors.enum';
import { FilterChoices } from '../core/models/interfaces/filterChoices.model';


@Component({
  selector: 'kb-concepts',
  templateUrl: './concepts.component.html',
  styleUrls: ['./concepts.component.scss']
})
export class ConceptsComponent implements OnInit {

  private media$!: Observable<MediaChange[]>;

  private subs = new SubSink();

  concepts:IConcept[] = [];
  filteredConcepts:any = [];

  //kanban tab

  selectedFilter: string;

  boxDetails:string[];

  kanbanLabels:string[] = [];
  kanbanHeaders:string[] = [];

  filterChoices:FilterChoices;


//table tab

columns:string[] =[
  "action",
  "title",
  "necessity",
  "level",
  "tag"
]
 
  tagChoices = [
    Tag[0],
    Tag[1],
    Tag[2],
    Tag[3]
  ]

  filters:string[] = ["necessity", "level"];

  displayNames:string[] = ["Actions","Title", "Necessity","Level", "Tag"];


  //add Concept tab

  necessityChoices = [
    {name: Necessity[0], value:0},
    {name:Necessity[1], value:1},
    {name: Necessity[2], value:2},
    {name:Necessity[3], value: 3} 
  ] 

  levelChoices = [
    {name: Level[0], value:0},
    {name: Level[1], value:1},
    {name: Level[2], value:2},
    {name: Level[3], value: 3},
    {name: Level[4], value: 4}
  ] 
  addConceptControls:IControlModel[] = [
    {
      name:"Title", 
      type:"string", 
      required:true, 
      default: '',

    },
    {
      name:"Necessity", 
      type:"stringChoice", 
      required:true, 
      default:1,
      stringChoices:this.necessityChoices
    },
    {
      name:"Level", 
      type:"stringChoice", 
      required:true, 
      default:1,
      stringChoices:this.levelChoices
    },
    {
      name:"Tag", 
      type:"stringChoiceSet", 
      required:true, 
      default:"Programming",
      stringChoices:this.tagChoices
    },
  ];

  mediaSize:string = '';

  sizes:string[] = ['xs','sm','md','lg','xl','lt-sm',
  'lt-md','lt-lg','lt-xl','gt-xs','gt-sm','gt-md','gt-lg'];

   
  
 
  constructor(
    private backend:BackendService, 
    public dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private gamifyService:GamificationServiceService,
    private _snackBar: MatSnackBar,
    private media:MediaObserver

    ) {
        this.media$ = media.asObservable();

        this.selectedFilter = 'level';
        this.boxDetails = [
          "necessity",
          "level" ,
          "tag"
        ];

        this.filterChoices = {
          necessities: [
            Necessity[0],
            Necessity[1],
            Necessity[2],
            Necessity[3]
          ],
          levels: [
            Level[0],
            Level[1],
            Level[2],
            Level[3],
            Level[4]
          ]
        }



      
      
        
     }

  ngOnInit(): void { //put the method in the constructor

    this.subs.sink = this.media$.subscribe(m => this.mediaSize = m[0].mqAlias);

    this.spinner.show();
    this.backend.getConcepts();
    this.subs.sink = this.backend.concepts$
      .subscribe(concepts => {
        console.dir(this.concepts);
        this.concepts = [...concepts];
        if(concepts.length > 0) {
          this.filterConceptsForKanban(this.selectedFilter);
        }

        setTimeout(() => {
          /** spinner ends after 5 seconds */
          this.spinner.hide();
        }, 2000);
       
      })

    

  }

  filterConceptsForKanban(selectedFilter:string) {
    this.filteredConcepts = [];
    switch (selectedFilter) {
      case 'level':
        this.filterChoices.levels.forEach((choice, i) => {
          this.filteredConcepts.push(this.concepts.filter(concept => concept.level === i));
        })
        this.kanbanLabels = this.boxDetails.filter(detail => detail !== 'level');
        this.kanbanHeaders = this.filterChoices.levels;
        break;

      case 'necessity':
        this.filterChoices.necessities.forEach((choice, i) => {
          this.filteredConcepts.push(this.concepts.filter(concept => concept.necessity === i));
        })
        this.kanbanLabels = this.boxDetails.filter(detail => detail !== 'necessity');
        this.kanbanHeaders = this.filterChoices.necessities;
        break;

      case 'tag':
        this.tagChoices.forEach((choice, i) => {
          this.filteredConcepts.push(this.concepts.filter(concept => concept.tag === this.tagChoices[i]));
        })
        this.kanbanLabels = this.boxDetails.filter(detail => detail !== 'tag');
        this.kanbanHeaders= this.tagChoices;
        break;
      case 'all':
        this.filteredConcepts = [...this.concepts];
        this.kanbanLabels = this.boxDetails.filter(detail => detail !== 'tag');
        this.kanbanHeaders= this.tagChoices;
        break;
    }
  }



  detail(row:IConcept) {
        const dialogRef = this.dialog.open(ConceptDetailComponent, {
          width: '250px',
          data: { concept: row} 
        });
    
        this.subs.sink = dialogRef.afterClosed().subscribe(result => {

        });
   
  }

  submit(event:any) {

    this.backend.addConcepts(event);
    this._snackBar.open(this.gamifyService.getQuoteMessage(), `Successfully Added!`, {
      duration: 4000,
    });
  }

  deleteConcept(event:any) {
    this.backend.deleteConcept(event);
  }

  howToAddConcept() {
    const dialogRef = this.dialog.open(PopupExampleComponent, {
      width: 'auto',
      height: 'auto',
      data: '../../assets/images/howto/howtoaddconcept.gif'
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
