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
// @run-at       document-idle
// ==/UserScript==

// Servicely already has jQuery & Knockout loaded
/* globals jQuery, $, KO, Mousetrap, htm, vanillaH */
const html = htm.bind(vanillaH(document));

const SCRIPT_NAME = "Servicely Super Menu";
const PKG_NAME = "servicely-super-menu";
const FOCUS_CLASS = "is-current";
const ICON = "fa-rocket";
const SCRIPT_ICON = "fa-terminal";
const MODAL_WIDTH = "600px";

let visibleLinks = [];
let firstTab = true;
let focusedLinkIndex = -1;

(() => {
	waitForSelector(".app-header-console-content", () => {
		log("Initializing Menu");
		appendMenuHtml();
		addMenuButtons();
	});

	defineHotkey("!", () => {
		const topics = $("#main-navigation li.menu-application-item > a");
		topics.each((_, heading) => {
			log(`Expanding ${heading.innerText}`);
			$(heading).click();
		});
	});

	defineHotkey("?", () => {
		firstTab = true;
		visibleLinks = [];
		const searchField = $('input[name="search-main-menu"]');
		if (searchField.length) {
			searchField.val("").focus();
		}
	});

	defineHotkey("enter", () => {
		const href = $(visibleLinks[focusedLinkIndex]).attr("href");
		if (href.length) {
			log(`Clicking ${focusedLinkIndex}`, visibleLinks[focusedLinkIndex]);
			window.location = href;
		}
	});

	defineHotkey("tab", () => handleTab(true)); // Bind forward tab
	defineHotkey("shift+tab", () => handleTab(false)); // Bind reverse tab

	defineHotkey("alt+m", () => {
		log("Toggling menu visibility");
		$("#menu-trigger").click();
	});

	defineHotkey("alt+b", () => {
		$("button:contains('Back')").click();
	});

	defineHotkey("alt+n", () => {
		const resource = window.location.href.match(/#\/(\w+)/)[1];
		log(`Starting new ${resource}`);
		$("button:contains('New')").click();
	});

	/*
	defineHotkey("alt+z", () => {
		const content = html`<div id="testest">hi<span data-bind="text: personName">taco</span></div>`;
		$("#detailMain").html(content);
	});

	defineHotkey("alt+x", () => {
		const myViewModel = {
			personName: KO.observable("Bob"),
			personAge: KO.observable(123),
		};
		setInterval(() => myViewModel.personName(new Date()), 500);
		KO.applyBindings(myViewModel, document.getElementById("testest"));
	});
*/
})();

function log(...args) {
	console.log(
		`%c${SCRIPT_NAME.replaceAll(" ", "")}`,
		"background-color:#870BC8;color:white;font-size:1rem;padding:0 5px;border-radius:10px;",
		...args,
	);
}

function defineHotkey(combo, handler) {
	log(`Binding Hotkey: ${combo}`);
	Mousetrap.bind(combo, (e) => {
		log(`Hotkey Pressed: "${combo}"`);
		e.preventDefault();
		handler();
	});
}

function appendMenuHtml() {
	const modalHtml = html`
        <div id="${PKG_NAME}" class="${PKG_NAME}_modal">
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
}

function addMenuButtons() {
	const modal = $(`#${PKG_NAME}`);
	const rocketButton = $(
		`<a class="app-header-console-btn" title="${SCRIPT_NAME}" href=""><i class="fa ${ICON}"></i></a>`,
	).click((e) => {
		e.preventDefault();
		modal.show();
	});

	const scriptButton = $(
		`<a class="app-header-console-btn" title="Server Script" href="/#/View/ServerScript"><i class="fa ${SCRIPT_ICON}"></i></a>`,
	);

	$(`.${PKG_NAME}_close-btn`, modal).click(() => modal.hide());
	$(".app-header-console-content span a:last")
		.after(rocketButton)
		.after(scriptButton);
}

function waitForSelector(selector, callback, interval) {
	const poller = setInterval(() => {
		const el = jQuery(selector);
		if (el.length < 1) return;
		clearInterval(poller);
		callback(el.length ? el : null);
	}, interval || 200);
}

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
  width: ${MODAL_WIDTH};
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
`);
