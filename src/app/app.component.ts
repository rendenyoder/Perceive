import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { settings } from './shared/model/mode';
import { AppTheme } from './shared/model/theme';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('appHeader', {static: false}) appHeader;

  @ViewChild('appSearch', {static: false}) appSearch;

  appTheme: AppTheme;
  searchTerm = '';
  isSearchExpanded = false;
  hasSearched = false;
  showHelpInfo = false;
  isReadView = false;
  isHeaderHidden = false;
  searchResults = {};
  hasSearchResults = false;
  versionNames = [];
  modeSettings = settings;
  modes = Object.values(settings.modes);
  content = {};
  zoom = { factor: 1, step: 0.1, min: 1, max: 2 };

  constructor(private changeDetector: ChangeDetectorRef) { }

  ngOnInit() {
    this.appTheme = new AppTheme();
  }

  /**
   * Sets the current search results from a search event.
   */
  setSearchResults($event) {
    const search = () => {
      this.hasSearched = true;
      this.isReadView = false;
      this.searchResults = {results: Array.from($event)};
      if (this.searchResults['results'] && this.searchResults['results'].length > 0) {
        this.hasSearchResults = this.searchResults['results'].some(item => {
          return item.results && (item.results.total || item.results.passages);
        });
        this.versionNames = this.searchResults['results'].map(res => res.name);
      }
    };
    // if effect still active, destroy then search
    if (this.appTheme.isEffectActive()) {
      this.appTheme.destroyEffect(search);
    } else {
      search();
    }
  }

  /**
   * Displays the selected content.
   * @param $event The content to be displayed.
   */
  display($event) {
    this.isHeaderHidden = true;
    this.isReadView = true;
    this.content = $event;
  }

  /**
   * Opens content in the specified read view.
   * @param modeId The view mode to open content in.
   * @param query The search query to use.
   * @param versions The version to search from.
   * @param selected The selected passages or verses. Undefined will be interpreted as select all.
   * @param limit The number of results to fetch.
   * @param offset The offset of results.
   */
  openContent(modeId, query, versions, selected?, limit?, offset?) {
    this.modeSettings.current = modeId;
    this.searchTerm = query;
    if (versions) {
      this.appHeader.selectVersions(...versions);
    }
    this.appHeader.doSearch(this.searchTerm, limit, offset).subscribe(res => {
      this.setSearchResults(res);
      // TODO: Really should not be calling detectChanges()...
      this.changeDetector.detectChanges();
      if (this.appSearch) {
        res.forEach(version => {
          if (version.results && version.results.verses) {
            version.results.verses.forEach(v => {
              if (!selected || selected.includes(v.id)) {
                this.appSearch.select(v, version, false);
              }
            });
          }
          if (version.results && version.results.passages) {
            version.results.passages.forEach(p => {
              if (!selected || selected.includes(p.id)) {
                this.appSearch.select(p, version, true);
              }
            });
          }
        });
        this.appSearch.displayResults();
      }
    });
  }

  /**
   * Increases the current zoom factor.
   */
  zoomIn() {
    if (this.zoom.factor < this.zoom.max) {
      this.zoom.factor += this.zoom.step;
    }
  }

  /**
   * Decreases the current zoom factor.
   */
  zoomOut() {
    if (this.zoom.factor > this.zoom.min) {
      this.zoom.factor -= this.zoom.step;
    }
  }

  /**
   * Updates the search term.
   * @param $event the new search term.
   */
  updateSearchTerm($event) {
    this.searchTerm = $event;
  }

  /**
   * Updates the state of the search settings expanded flag.
   * @param $event the new state.
   */
  updateSearch($event) {
    this.isSearchExpanded = $event;
  }

  /**
   * Closes the current content view.
   */
  close() {
    this.isHeaderHidden = false;
    this.isReadView = false;
  }

  /**
   * Show help info.
   */
  showHelp() {
    const help = () => {
      this.showHelpInfo = true;
      this.hasSearched = true;
      this.isSearchExpanded = false;
    };
    // if effect still active, destroy then show help
    if (this.appTheme.isEffectActive()) {
      this.appTheme.destroyEffect(help);
    } else {
      help();
    }
  }

  /**
   * Scrolls view to the updated element and updates search term.
   * @param $element the updated element.
   * @param term the new search term.
   */
  scrollSearchTerm($element, term) {
    this.isSearchExpanded = false;
    this.scrollToElement($element, () => this.searchTerm = term);
  }

  /**
   * Scrolls view to the updated element and updates search expanded state.
   * @param $element the updated element.
   * @param state the new search expanded state.
   */
  scrollSearchExpand($element, state) {
    this.scrollToElement($element, () => this.isSearchExpanded = state);
  }

  /**
   * Scrolls to given element.
   * @param $element the element to scroll to.
   */
  private scrollToElement($element, lambda): void {
    $element.scrollIntoView({behavior: 'smooth', block: 'start', inline: 'nearest'});
    setTimeout(() => lambda(), 150);
  }
}
