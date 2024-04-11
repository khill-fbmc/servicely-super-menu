// ==UserScript==
// @name         Servicely Super Menu
// @namespace    http://gofortuna.com
// @version      2.2.0
// @description  Sidebar search enhancements
// @author       You
// @match        https://fortuna.servicely.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=servicely.ai
// @grant        GM_addStyle
// @require      https://unpkg.com/mousetrap@1.6.5/mousetrap.js
// @require      https://unpkg.com/htm@3.1.1/dist/htm.umd.js
// @require      https://unpkg.com/vanillah@1.0.7/dist/vanillah.umd.js
// @require      https://unpkg.dev/fuzzy@0.1.3/lib/fuzzy.js
// @run-at       document-idle
// ==/UserScript==

// Servicely already has jQuery & Knockout loaded
/* globals jQuery, $, KO, Mousetrap, htm, vanillaH, fuzzy */
const html = htm.bind(vanillaH(document));

const SCRIPT_NAME = "Servicely Super Menu";
const PKG_NAME = "servicely-super-menu";
const HELP_MODAL_ID = `${PKG_NAME}-help`;
const SEARCH_MODAL_ID = `${PKG_NAME}-search`;
const FOCUS_CLASS = "is-current";
const ICON = "fa-rocket";
const SCRIPT_ICON = "fa-terminal";
const MODAL_WIDTH = "600px";
const FORTUNA_PURPLE = "#870BC8";

(() => {
	let model = {}; // Placeholder for KO

	waitForSelector(".app-header-console-btn", () => {
		log("Initializing");

		//appendMenuHtml();
		appendSearchHtml();
		//addMenuButtons();

		waitForKO((KO) => {
			model = applyKO({ KO, model });
			log("KO model ready", model);

			defineHotkey("alt+z", function openSearchModal() {
				const searchModal = $(`#${SEARCH_MODAL_ID}`);
				model.populateList();
				searchModal.show();
				$("input", searchModal).focus();
			});
		});
	});

	defineHotkey("?", function clearAndFocusSearchField() {
		firstTab = true;
		visibleLinks = [];
		const searchField = $('input[name="search-main-menu"]');
		if (searchField.length) {
			searchField.val("").focus();
		}
	});

	defineHotkey("enter", function clickFocusedLink() {
		const href = $(visibleLinks[focusedLinkIndex]).attr("href");
		if (href.length) {
			log(`Navigating to ${visibleLinks[focusedLinkIndex]}`);
			window.location = href;
		}
	});

	defineHotkey("tab", function moveFocusDownList() {
		handleTab(true); // forward tab
	});

	defineHotkey("shift+tab", function moveFocusUpList() {
		handleTab(false); // reverse tab
	});

	defineHotkey([": b", "alt+b"], function clickBackButton() {
		$("button:contains('Back')").click();
		return false;
	});

	defineHotkey([": n", "alt+n"], function clickNewButton() {
		log("Clicking New button");
		$("button:contains('New')").click();
		return false;
	});

	defineHotkey("escape", function closeModals() {
		$(`#${HELP_MODAL_ID}`).hide();
		$(`#${SEARCH_MODAL_ID}`).hide();
	});

	defineHotkey([": x", "mod+s"], function clickSaveOrCreate() {
		const save = $("button:contains('Save')");
		const create = $("button:contains('Create')");
		if (create.length) {
			log("Clicking Create button");
			create.click();
		} else if (save.length) {
			log("Clicking Save button");
			save.click();
		} else {
			log("No 'Create' or 'Save' button found to click");
		}
		return false;
	});

	defineHotkey(": w", function clickSaveAndStay() {
		const label = "Save & stay";
		const save = $(`button:contains("${label}")`);
		if (save.length) {
			log(`Clicking "${label}" button`);
			save.click();
		} else {
			log(`"${label}" button not found`);
		}
		return false;
	});

	defineHotkey("up", () => {
		const searchModal = $(`#${SEARCH_MODAL_ID}`);
	});

	defineHotkey("down", () => {
		const searchModal = $(`#${SEARCH_MODAL_ID}`);
	});

	defineHotkey("!", () => {
		const topics = $("#main-navigation li.menu-application-item > a");
		topics.each((_, heading) => {
			log(`Expanding ${heading.innerText}`);
			$(heading).click();
		});
	});
})();

function log(...args) {
	console.log(
		`%c${SCRIPT_NAME.replaceAll(" ", "")}`,
		`background-color:${FORTUNA_PURPLE};color:white;font-size:1rem;padding:0 5px;border-radius:10px;`,
		...args,
	);
}

function appendMenuHtml() {
	const modalHtml = html`
        <div id="${HELP_MODAL_ID}" class="${PKG_NAME}_modal">
            <div class="${PKG_NAME}_modal-content">
                <span class="${PKG_NAME}_close-btn">×</span>
			    <h1><i class="fa ${ICON}"></i>${SCRIPT_NAME}</h1>
			    <p>Welcome! This UserScript adds hotkeys to aid the navigation of Servicely via the keyboard.</p>
			    <p>The hotkeys are divided into two groups, to control the sidbar and click buttons.</p>
                <h2>Sidebar</h2>
			    <p><kbd>!</kbd> Expand / Collapse all top level headings.</p>
                <p><kbd>?</kbd> Clear and focus the sidebar search menu.</p>
                <p><kbd>tab</kbd> Moves the sidebar menu focus down the tree.</p>
                <p><kbd>shift</kbd> + <kbd>tab</kbd> Moves the sidebar menu focus up the tree.</p>
                <p><kbd>alt</kbd> + <kbd>m</kbd> Show / Hide the sidebar menu.</p>
                <h2>Buttons</h2>
                <p><kbd>alt</kbd> + <kbd>n</kbd> Trigger a click on the 'New' button.</p>
                <p><kbd>alt</kbd> + <kbd>b</kbd> Trigger a click on the 'Back' button.</p>
			</div>
        </div>`;
	document.body.appendChild(modalHtml);
	log("Appended Menu HTML");
	const helpModal = $(`#${HELP_MODAL_ID}`);
	$(`.${PKG_NAME}_close-btn`, helpModal).click(() => helpModal.hide());
}

/**
 * @return model
 */
function appendSearchHtml() {
	const modalHtml = html`
        <div id="${SEARCH_MODAL_ID}" class="${PKG_NAME}_modal">
            <div class="${PKG_NAME}_modal-content">
                <span class="${PKG_NAME}_close-btn">×</span>
			    <h1><i class="fa fa-search"></i>Quick Search</h1>
                <input data-bind="textInput: query" />
                <ul class="results-list" data-bind="foreach: results">
                    <li>
                       <a data-bind="attr: { href: $data.original.href }">
                         <div data-bind="html: $data.string"></div>
                       </a>
                    </li>
                </ul>
			</div>
        </div>`;
	document.body.appendChild(modalHtml);
	log("Appended Search HTML");
	const searchModal = $(`#${SEARCH_MODAL_ID}`);
	$(`.${PKG_NAME}_close-btn`, searchModal).click(() => searchModal.hide());
}

function addMenuButtons() {
	log("Adding menu buttons");
	const helpModal = $(`#${HELP_MODAL_ID}`);

	const scriptButton = $(
		`<a class="app-header-console-btn" title="Server Script" href="/#/View/ServerScript"><i class="fa ${SCRIPT_ICON}"></i></a>`,
	);

	const rocketButton = $(
		`<a class="app-header-console-btn" title="${SCRIPT_NAME}" href=""><i class="fa ${ICON}"></i></a>`,
	).click((e) => {
		e.preventDefault();
		helpModal.show();
	});

	$(".app-header-console-content span a:last")
		.after(rocketButton)
		.after(scriptButton);
}

function defineHotkey(bindings, handler) {
	//(Array.isArray(bindings) ? bindings : [bindings]).forEach(b => log(`Binding Hotkey: "${b}"`));
	Mousetrap.bind(bindings, (e, combo) => {
		log(`Hotkey Pressed: "${combo}"`);
		e.preventDefault();
		return handler();
	});
}

function waitForSelector(selector, callback) {
	log("Waiting for:", selector);
	const poller = setInterval(() => {
		const el = document.querySelectorAll(selector);
		if (el.length) {
			log(selector, "Was found!");
			clearInterval(poller);
			callback();
		}
	}, 500);
}

function waitForKO(callback) {
	log("Waiting for KO");
	const poller = setInterval(() => {
		if (KO) {
			log("KO is now defined");
			clearInterval(poller);
			callback(KO);
		}
	}, 500);
}

/**
 * Build and apply the KO bindings for the search
 */
function applyKO({ KO, model }) {
	log("Applying KO bindings");

	model = {
		query: KO.observable(),
		list: KO.observableArray(),
		results: KO.observableArray(),
		populateList: function () {
			log("Populating link list");

			const links = $("#main-navigation a.menu-application-page-btn span");
			log(`Found ${links.length} links`);

			const mapped = links.map((_, el) => {
				return {
					label: el.innerText,
					href: el.parentElement.href,
				};
			});

			KO.utils.arrayPushAll(this.list, Array.from(mapped));
		},
		pushResult: function (item) {
			this.results.push(item);
		},
	};

	/**
	 * When the search field updates fuzzy filter the list
	 */
	model.query.subscribe((newValue) => {
		log(`Searching link list: ${newValue}`);

		model.results([]);

		const results = fuzzy.filter(newValue, model.list(), {
			pre: `<span class="highlighted-match">`,
			post: "</span>",
			extract: (item) => item.label,
		});
		log("Results:", results);

		const matches = results.map((el) => el.string);

		for (const match of results.slice(0, 15)) {
			model.pushResult(match);
		}
	});

	KO.applyBindings(model, document.getElementById(SEARCH_MODAL_ID));

	return model;
}

let visibleLinks = [];
let firstTab = true;
let focusedLinkIndex = -1;
function handleTab(isForward) {
	log("Moving focus");
	if (firstTab) {
		const links = $("#main-navigation a.menu-application-page-btn:visible");
		if (links.length > 0) {
			visibleLinks = links;
			firstTab = false;
			// Initialize focused index based on the direction
			focusedLinkIndex = isForward ? -1 : 0;
		} else {
			// No visible links to navigate
			return false;
		}
	}

	// Clear current focus
	if (visibleLinks[focusedLinkIndex]) {
		$(visibleLinks[focusedLinkIndex]).removeClass(FOCUS_CLASS);
	}

	if (isForward) {
		// Move forward through the list
		focusedLinkIndex++;
		if (focusedLinkIndex >= visibleLinks.length) {
			focusedLinkIndex = 0; // Wrap to the beginning
		}
	} else {
		// Move backward through the list
		focusedLinkIndex--;
		if (focusedLinkIndex < 0) {
			focusedLinkIndex = visibleLinks.length - 1; // Wrap to the end
		}
	}

	if (visibleLinks[focusedLinkIndex]) {
		$(visibleLinks[focusedLinkIndex]).addClass(FOCUS_CLASS);
		log(`Focusing index ${focusedLinkIndex}`);
	}

	return false; // Prevent the default tab behavior
}

const localStore = {
	set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
	get: (key) => {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	},
	remove: (key) => localStorage.removeItem(key),
	clear: () => localStorage.clear(),
};

GM_addStyle(`
.${PKG_NAME}_modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 9999; /* Sit on top */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0,0,0);
  background-color: rgba(0,0,0,0.6);
}

.${PKG_NAME}_modal-content {
  background-color: #fefefe;
  margin: 5% auto;
  padding: 20px;
  border: 1px solid #888;
  border-radius: 6px;
}

#${HELP_MODAL_ID} .${PKG_NAME}_modal-content {
  width: ${MODAL_WIDTH};
}

#${SEARCH_MODAL_ID} .${PKG_NAME}_modal-content {
  width: 400px;
}

.${PKG_NAME}_modal-content kbd:last-child {
  margin-right: 5px;
}

.${PKG_NAME}_modal-content h1 {
  margin-top: 0 !important;
}

.${PKG_NAME}_modal-content h1 i {
  margin-right: 15px;
}

/* The Close Button */
.${PKG_NAME}_close-btn {
  color: #aaa;
  display: inline-block;
  float: right;
  font-size: 28px;
  font-weight: bold;
}

.${PKG_NAME}_close-btn:hover,
.${PKG_NAME}_close-btn:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

#${SEARCH_MODAL_ID} {
  & input {
    padding: 20px 15px;
    font-size: 1.2em;
    border-radius: 5px;
  }

  & ul {
    list-style: none;
    font-size: 1em;

    & li {
      padding: 2px 0;

      & span.highlighted-match {
        color: #777;
        text-decoration: underline;
      }
    }
  }
}
`);
