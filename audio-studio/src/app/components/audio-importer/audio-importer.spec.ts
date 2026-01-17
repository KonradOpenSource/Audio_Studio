import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioImporterComponent } from './audio-importer';

describe('AudioImporterComponent', () => {
  let component: AudioImporterComponent;
  let fixture: ComponentFixture<AudioImporterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioImporterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioImporterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
