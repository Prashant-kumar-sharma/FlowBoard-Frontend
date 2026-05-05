import { PriorityBadgeComponent } from './priority-badge.component';

describe('PriorityBadgeComponent', () => {
  it('maps each priority to its expected classes', () => {
    const component = new PriorityBadgeComponent();

    component.priority = 'LOW';
    expect(component.classes).toEqual(jasmine.objectContaining({ 'bg-gray-100 text-gray-600': true }));

    component.priority = 'MEDIUM';
    expect(component.classes).toEqual(jasmine.objectContaining({ 'bg-blue-100 text-blue-700': true }));

    component.priority = 'HIGH';
    expect(component.classes).toEqual(jasmine.objectContaining({ 'bg-orange-100 text-orange-700': true }));

    component.priority = 'CRITICAL';
    expect(component.classes).toEqual(jasmine.objectContaining({ 'bg-red-100 text-red-700': true }));
  });
});
