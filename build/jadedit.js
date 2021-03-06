/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var EDITOR = (function () {
	var editor = {};

	// Returns a string value representing the editor template
	// =======================================================

	editor.getEditorTemplate = function (inputName) {
		return "<div id='jadedit-container'>" +
			"<div id='jadedit-button-controls'>" +
				"<div id='jadedit-editor-button' class='chosen'>Editor</div>" +
				"<div id='jadedit-preview-button'>Preview</div>" +
			"</div>" +
			"<div id='jadedit-editor-container'>" +
				"<textarea id='jadedit-editor' spellcheck='false'></textarea>" +
				"<div id='jadedit-preview' style='display: none;'></div>" +
				"<input type='hidden' id='jadedit-hidden' name='" + inputName + "' />" +
			"</div>" +
		"</div>";
	}

	return editor;
}());
/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var EVENTS = (function() {
	var events = {};

	// Registers the global editor events
	// ==================================

	events.registerEditorEvents = function(editorElements) {
		editorElements.editorButton.onclick = function () {
			editorElements.preview.style.display = 'none';
			editorElements.editor.style.display = 'block';
			editorElements.editorButton.className = "chosen";
			editorElements.previewButton.className = "";
		}

		editorElements.previewButton.onclick = function () {
			editorElements.preview.style.display = 'block';
			editorElements.editor.style.display = 'none';
			editorElements.previewButton.className = "chosen";
			editorElements.editorButton.className = "";
		}
	}

	return events;
}());
/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var UTIL = (function() {
	var utilities = {};

	// Counts the number of tabs in a string passed in
	// ===============================================

	utilities.tabCounter = function(str) {
		for (var tabCount = 0; tabCount < str.length; tabCount++) {
			if (str[tabCount] != '\t') {
				return tabCount;
			}
		}
	}

	// Trims only the white spaces in the beginning of the string
	// ==========================================================

	utilities.trimStart = function(str) {
		return str.replace(/^( |\t)+/, '');
	}

	return utilities;
}());
/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var JADE_PROCESSOR = (function(UTIL) {
	var jadeProcessor = {};

	jadeProcessor.process = function(currentLocation, splitedByLine) {
		var currentLineContents = splitedByLine[currentLocation];
		if (currentLineContents.length < 1) {
			return {
				'processedLine': "",
				'newLocation': currentLocation
			}
		}

		var currentInnerContents = "";

		var currentTabCount = UTIL.tabCounter(currentLineContents);
		currentLineContents =  UTIL.trimStart(currentLineContents);

		var isContinuedLine = currentLineContents[0] == '|';

		var firstSpace = currentLineContents.indexOf(' ');
		if (firstSpace == -1) firstSpace = currentLineContents.length;

		var currentElement = currentLineContents.substring(0, firstSpace);
		currentInnerContents +=
			UTIL.trimStart(currentLineContents.substring(firstSpace, currentLineContents.length));

		// handling child elements
		while (currentLocation + 1 < splitedByLine.length
			&& (currentTabCount + 1) == UTIL.tabCounter(splitedByLine[currentLocation + 1])) {
			currentLocation++;

			var recursionResult = this.process(currentLocation, splitedByLine);
			currentInnerContents += recursionResult.processedLine;
			currentLocation = recursionResult.newLocation;
		}

		return {
			'processedLine': createTag(currentElement, currentInnerContents, isContinuedLine),
			'newLocation': currentLocation
		};
	};

	function createTag(element, innerContents, isContinuedLine) {
		var processedElement = processTagAttributes(UTIL.trimStart(element));
		if (processedElement.withoutAttribute === 'pre') {
			if (!isContinuedLine)
				return "<" + processedElement.withAttribute + ">" +
					innerContents +
					"</" + processedElement.withoutAttribute + ">";
			else
				return innerContents;
		}

		if (processedElement.withoutAttribute !== 'br' && processedElement.withoutAttribute !== 'pre') {
			if (!isContinuedLine)
				return "<" + processedElement.withAttribute + ">" +
					innerContents +
					"</" + processedElement.withoutAttribute + ">\n";
			else
				return innerContents + '\n';
		}
		if (!isContinuedLine)
			return "<" + processedElement.withAttribute + "/>" +
				innerContents + '\n';
		else
			return innerContents + '\n';
	}

	function processTagAttributes(element) {
		var elementWithAttribute = "";
		var elementWithoutAttribute = "";

		//TODO: Refactor
		for (var i = 0; i < element.length; i++) {
			if (element[i] == '.') {
				elementWithAttribute += " class='";
				i++;
				while (element[i] != '.' && element[i] != '#' && i < element.length) {
					elementWithAttribute += element[i];
					i++;
				}

				if (element[i] == '.' || element[i] == '#') {
					i--;
				}

				elementWithAttribute += "'";
			} else if (element[i] == '#') {
				elementWithAttribute += " id='";
				i++;
				while (element[i] != '.' && element[i] != '#' && i < element.length) {
					elementWithAttribute += element[i];
					i++;
				}

				if (element[i] == '.' || element[i] == '#') {
					i--;
				}

				elementWithAttribute += "'";
			}
			else if (element[i] == '(') {
				while (element[i] != ')' && i < element.length) {

				}
			}
			else {
				elementWithAttribute += element[i];
				elementWithoutAttribute += element[i];
			}
		}

		return {
			'withAttribute': elementWithAttribute,
			'withoutAttribute': elementWithoutAttribute
		};
	}

	return jadeProcessor;
}(UTIL));
/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var HTML_PROCESSOR = (function(UTIL) {
	var htmlProcessor = {};

	htmlProcessor.process = function() {
		return "";
	};

	return htmlProcessor;
}(UTIL));
/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var PROCESSOR = (function() {
	var currentProcess = {};

	var processor = {
		html: HTML_PROCESSOR,
		jade: JADE_PROCESSOR
	};

	// Sets the current processor
	// ==========================

	processor.setCurrentProcessor = function(processorType) {
		if (processorType === 'html') {
			currentProcess =  processor.html;
		} else if (processorType === 'jade') {
			currentProcess =  processor.jade;
		}
	}

	// Calls the process method of the current processor
	// =================================================

	processor.process = function(source) {
		var result = "";

		var splitedByLine = source.split('\n');

		for (var i = 0; i < splitedByLine.length; i++) {
			var currentResult = currentProcess.process(i, splitedByLine);
			result += currentResult.processedLine;
			i = currentResult.newLocation;
		}

		return result;
	}

	return processor;
}());
/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var JADE_HIGHLIGHTER = (function(UTIL) {
	var jadeHighlighter = {};

	jadeHighlighter.highlight = function() {
		return "";
	};

	return jadeHighlighter;
}(UTIL));

/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var HTML_HIGHLIGHTER = (function(UTIL) {
	var htmlHighlighter = {};

	htmlHighlighter.highlight = function() {
		return "";
	};

	return htmlHighlighter;
}(UTIL));

/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var HIGHLIGHTER = (function() {
	var currentHighlighter = {};

	// Highlighter configurations
	// ==========================

	var highlighter = {
		html: HTML_HIGHLIGHTER,
		jade: JADE_HIGHLIGHTER
	};

	// Sets the current highlighter
	// ============================

	highlighter.setCurrentProcessor = function(highlightType) {
		if (highlightType === 'html') {
			currentHighlighter =  highlighter.html;
		} else if (highlightType === 'jade') {
			currentHighlighter =  highlighter.jade;
		}
	}

	highlighter.process = function(source) {

		// return currentHighlighter.highlight();
	}

	return highlighter;

}());
/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

var KEYSTROKE_HANDLER = (function (PROCESSOR) {
	var keystrokeHandler = {};

	// Enables tab key functionality in the editor
	// ==========================================

	keystrokeHandler.enableTab = function(editorElements)
	{
		editorElements.editor.onkeydown = function (e) {
			if (e.keyCode === 9) {
				var val = this.value,
					start = this.selectionStart,
					end = this.selectionEnd;

				this.value = val.substring(0, start) + '\t' + val.substring(end);
				this.selectionStart = this.selectionEnd = start + 1;
				return false;
			}
		};
	}

	// Sets the type of process to use on key up event in the editor
	// ============================================================

	keystrokeHandler.enablePreview = function(editorElements) {
		editorElements.editor.onkeyup = function () {
			var result = PROCESSOR.process(editorElements.editor.value);

			editorElements.hidden.value = result;
			editorElements.preview.innerHTML = result;
		}
	}

	return keystrokeHandler;
}(PROCESSOR));
/* JadEdit - An embeddable JavaScript editor using Jade template syntax.
 * ===================================================================== */

// The staring point of the applications. Initializes the components
// =================================================================

(function Main(EDITOR, EVENTS, KEYSTROKE_HANDLER, PROCESSOR) {
	var editorContainer = document.getElementById('jadedit');
	if (editorContainer.length) {
		document.write('Editor Container is not found.');
		return;
	}

	if (!editorContainer.hasAttribute('name')) {
		document.write('Editor does not have a name.');
		return;
	}

	editorContainer.innerHTML = EDITOR.getEditorTemplate(editorContainer.getAttribute('name'));

	var editorElements = {
		editorButton: document.getElementById('jadedit-editor-button'),
		previewButton: document.getElementById('jadedit-preview-button'),
		editor:  document.getElementById('jadedit-editor'),
		preview: document.getElementById('jadedit-preview'),
		hidden:  document.getElementById('jadedit-hidden')
	};

	EVENTS.registerEditorEvents(editorElements);
	KEYSTROKE_HANDLER.enableTab(editorElements);

	PROCESSOR.setCurrentProcessor('jade');
	KEYSTROKE_HANDLER.enablePreview(editorElements);

}(EDITOR, EVENTS, KEYSTROKE_HANDLER, PROCESSOR));
