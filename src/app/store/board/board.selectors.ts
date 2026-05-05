import { createFeatureSelector, createSelector } from '@ngrx/store';
import { BoardState } from './board.reducer';

export const selectBoardState =
  createFeatureSelector<BoardState>('board');

export const selectBoard =
  createSelector(selectBoardState, s => s.board);

export const selectLists =
  createSelector(selectBoardState, s => s.lists);

export const selectAllCards =
  createSelector(selectBoardState, s => s.cards);

export const selectLoading =
  createSelector(selectBoardState, s => s.loading);

export const selectError =
  createSelector(selectBoardState, s => s.error);

export const selectCardsByList = (listId: number) =>
  createSelector(selectAllCards, cards =>
    cards
      .filter(c => c.listId === listId && !c.isArchived)
      .sort((a, b) => a.position - b.position)
  );

export const selectOverdueCards =
  createSelector(selectAllCards, cards =>
    cards.filter(c => c.isOverdue)
  );
