// ==UserScript==
// @name         Servicely Super Menu
// @namespace    http://gofortuna.com
// @version      2.0.1
// @description  Sidebar search enhancements
// @author       You
// @match        https://fortuna.servicely.ai/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=servicely.ai
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/mousetrap/1.6.5/mousetrap.min.js
// @run-at       document-idle
// ==/UserScript==

// Servicely already has jQuery loaded
/* globals jQuery, $, Mousetrap */

const SCRIPT_NAME = "Servicely Super Menu";
const PKG_NAME = "servicely-super-menu";
const FOCUS_CLASS = "is-current";
const ICON = `<i class="fa fa-rocket"></i>`;
const MODAL_WIDTH = "600px";

const SEARCH_INPUT = 'input[name="search-main-menu"]';

let visibleLinks = [];
let firstTab = true;
let focusedLinkIndex = -1;

const log = (...args) => {
	console.log(
		"%cServicelySuperMenu",
		"background-color:#870BC8;color:white;font-size:1rem;padding:0 5px;border-radius:10px;",
		...args,
	);
};

// biome-ignore lint/complexity/useArrowFunction: <explanation>
(function () {
	log("HIIIIIIIIIIIIIIIII");
	waitForEl(SEARCH_INPUT, () => {
		const search = document.querySelector(SEARCH_INPUT);
		search.placeholder = "? to focus search ...";
	});

	waitForEl(".app-header-console-content", () => {
		log("Menu Bar found; Adding Menu");
		setupMenu();
	});

	Mousetrap.bind("!", () => {
		const topics = $("#main-navigation li.menu-application-item > a");
		topics.each((idx, heading) => {
			console.log(heading);
			$(heading).click();
		});
	});

	Mousetrap.bind("?", () => {
		firstTab = true;
		visibleLinks = [];
		const searchField = $(SEARCH_INPUT);
		if (searchField) {
			searchField.val("").focus();
		}
	});

	Mousetrap.bind("enter", () => {
		log(`Clicking ${focusedLinkIndex}`, visibleLinks[focusedLinkIndex]);
		const href = $(visibleLinks[focusedLinkIndex]).attr("href");
		window.location = href;
	});

	Mousetrap.bind("tab", () => handleTab(true)); // Bind forward tab
	Mousetrap.bind("shift+tab", () => handleTab(false)); // Bind reverse tab

	Mousetrap.bind("down", () => handleTab(true)); // Bind forward tab
	Mousetrap.bind("up", () => handleTab(false)); // Bind reverse tab
})();

function setupMenu() {
	const modalHtml = $(
		[
			`<div id="${PKG_NAME}" class="${PKG_NAME}_modal">`,
			`  <div class="${PKG_NAME}_modal-content">`,
			`    <span class="${PKG_NAME}_close-btn">&times;</span>`,
			`    <h1>${ICON}${SCRIPT_NAME}</h1>`,
			"    <p>Welcome! This UserScript adds keyboard shortcuts to aid the navigation of Servicely via the keyboard.</p>",
			"    <h2>Active Hotkeys:</h2>",
			...[
				["!", "Expand / Collapse all top level headings."],
				["?", "Clear and focus the sidebar search menu."],
				[
					"up",
					"or <kbd>shift</kbd>+<kbd>tab</kbd> Moves the sidebar menu focus up the tree.",
				],
				[
					"down",
					"or <kbd>tab</kbd> Moves the sidebar menu focus down the tree.",
				],
			].map(([key, desc]) => `<p><kbd>${key}</kbd> ${desc}</p>`),
			"  </div>",
			"</div>",
		].join("\n"),
	);

	$("body").append(modalHtml);

	const modal = $(`#${PKG_NAME}`);
	$(`.${PKG_NAME}_close-btn`, modal).click(() => modal.hide());

	const newLink = $(
		`<a class="app-header-console-btn" title="${SCRIPT_NAME}" href="#">${ICON}</a>`,
	);

	$(newLink).click((e) => {
		e.preventDefault();
		modal.show();
	});
	log("Adding icon to top menu bar");
	$(".app-header-console-content span a:eq(1)").after(newLink);
}

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
  background-color: rgb(0,0,0); /* Fallback color */
  background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
}

.${PKG_NAME}_modal-content {
  background-color: #fefefe;
  margin: 10% auto; /* 15% from the top and centered */
  padding: 20px;
  border: 1px solid #888;
  border-radius: 6px;
  width: ${MODAL_WIDTH}; /* Could be more or less, depending on screen size */
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

/**
 * Wait for the specified element to appear in the DOM. When the element appears,
 * provide it to the callback.
 *
 * @param selector a jQuery selector (eg, 'div.container img')
 * @param callback function that takes selected element (null if timeout)
 * @param interval ms wait between each try
 */
function waitForEl(selector, callback, interval) {
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
