import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import * as BoardActions from './board.actions';
import { BoardService } from '../../core/services/board.service';
import { CardService } from '../../core/services/card.service';

@Injectable()
export class BoardEffects {

  constructor(
    private actions$: Actions,
    private boardService: BoardService,
    private cardService: CardService
  ) {}

  loadBoard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.loadBoard),
      switchMap(({ boardId }) =>
        forkJoin({
          board: this.boardService.getById(boardId),
          lists: this.cardService.getLists(boardId).pipe(
            catchError(() => of([]))
          ),
          cards: this.cardService.getByBoard(boardId).pipe(
            catchError(() => of([]))
          ),
        }).pipe(
          map(({ board, lists, cards }) =>
            BoardActions.loadBoardSuccess({ board, lists, cards })
          ),
          catchError(error =>
            of(BoardActions.loadBoardFailure({ error: error.message }))
          )
        )
      )
    )
  );

  moveCard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BoardActions.moveCard),
      switchMap(({ cardId, toListId, position }) =>
        this.cardService.move(cardId, toListId, position).pipe(
          map(card => BoardActions.moveCardSuccess({ card })),
          catchError(error =>
            of(BoardActions.loadBoardFailure({ error: error.message }))
          )
        )
      )
    )
  );
}
