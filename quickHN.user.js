// ==UserScript==
// @name         WME Quick HN
// @description  Quick House Numbers
// @version      0.13.1
// @author       Vinkoy
// @include      /^https:\/\/(www|beta)\.waze\.com\/(?!user\/)(.{2,6}\/)?editor.*$/
// @namespace    https://greasyfork.org/en/scripts/21378-wme-quick-hn
// @grant        none
// ==/UserScript==

(function() {
    var counter = 0;
    var interval = 1;
    var letterIndex = 0;
    var letters = [..."abcdefghijklmnopqrstuvwxyz"];

function quickHN_bootstrap()
{
    var oWaze=W;
	var oI18n=I18n;

	if (typeof unsafeWindow !== "undefined")
	{
		oWaze=unsafeWindow.W;
		oI18n=unsafeWindow.I18n;
	}

	if (typeof oWaze === "undefined")
	{
		setTimeout(quickHN_bootstrap, 500);
		return;
	}
	if (typeof oWaze.map === "undefined")
	{
		setTimeout(quickHN_bootstrap, 500);
		return;
	}
	if (typeof oWaze.selectionManager === "undefined")
	{
		setTimeout(quickHN_bootstrap, 500);
		return;
	}
	if (typeof oI18n === "undefined")
	{
		setTimeout(quickHN_bootstrap, 500);
		return;
	}
	if (typeof oI18n.translations === "undefined")
	{
		setTimeout(quickHN_bootstrap, 500);
		return;
	}

    oWaze.selectionManager.events.register("selectionchanged", null, addTab);

    setTimeout(initialiseQuickHN, 999);
}

function initialiseQuickHN()
{
    var editPanelChange = new MutationObserver(function(mutations)
    {
        mutations.forEach(function(mutation)
        {
            for (var i = 0; i < mutation.addedNodes.length; i++)
            {
                if (mutation.addedNodes[i].nodeType === Node.ELEMENT_NODE && mutation.addedNodes[i].querySelector('div.selection'))
                {
                    addTab();
                    if (document.getElementById("WME-Quick-HN")) localDataManager();
                }
            }
        });
    });
    editPanelChange.observe(document.getElementById('edit-panel'), { childList: true, subtree: true });

    var hnWindowShow = new MutationObserver(function(mutations)
    {
        mutations.forEach(function(mutation)
        {
            if (mutation.type == 'childList') {
                $('.sidebar-layout > .overlay').remove();
            }
        });
    });
    hnWindowShow.observe(document.getElementById('map-lightbox'), { childList: true, subtree: true } );

    I18n.translations[I18n.locale].keyboard_shortcuts.groups['default'].members.WME_QHN_newHN = "New HN (+1)";
    W.accelerators.addAction("WME_QHN_newHN", {group: 'default'});
    W.accelerators.events.register("WME_QHN_newHN", null, addHN);
    W.accelerators._registerShortcuts({ 't' : "WME_QHN_newHN"});

    I18n.translations[I18n.locale].keyboard_shortcuts.groups['default'].members.WME_QHN_newHN2 = "New HN (+2)";
    W.accelerators.addAction("WME_QHN_newHN2", {group: 'default'});
    W.accelerators.events.register("WME_QHN_newHN2", null, addHN2);
    W.accelerators._registerShortcuts({ 'r' : "WME_QHN_newHN2"});

    I18n.translations[I18n.locale].keyboard_shortcuts.groups['default'].members.WME_QHN_newHN3 = "New HN (+CUSTOM_VALUE)";
    W.accelerators.addAction("WME_QHN_newHN3", {group: 'default'});
    W.accelerators.events.register("WME_QHN_newHN3", null, addHN3);
    W.accelerators._registerShortcuts({ 'e' : "WME_QHN_newHN3"});

    I18n.translations[I18n.locale].keyboard_shortcuts.groups['default'].members.WME_QHN_newHN4 = "New alfanumeric HN";
    W.accelerators.addAction("WME_QHN_newHN4", {group: 'default'});
    W.accelerators.events.register("WME_QHN_newHN4", null, addHN4);
    W.accelerators._registerShortcuts({ 'x' : "WME_QHN_newHN4"});
}

function localDataManager()
{
    // restore saved settings
    if (localStorage.WMEquickHN)
    {
        options = JSON.parse(localStorage.WMEquickHN);
        if(options[1] !== undefined) {
            document.getElementById('_custominterval').value = options[1];
        }
        else {
            document.getElementById('_custominterval').value = 4;
        }
        if(options[2] !== undefined) {
            document.getElementById('_format').value = options[2];
        }
        else {
            document.getElementById('_format').value = "{%d}{%s}";
        }
    }
    else
    {
            document.getElementById('_custominterval').value = 4;
            document.getElementById('_format').value = "{%d}{%s}";
    }
    // overload the WME exit function
    wme_saveQuickHNOptions = function()
    {
        if (localStorage)
        {
            var options = [];

            // preserve previous options which may get lost after logout
            if (localStorage.WMEquickHN)
                options = JSON.parse(localStorage.WMEquickHN);

            options[1] = document.getElementById('_custominterval').value;
            options[2] = document.getElementById('_format').value;

            localStorage.WMEquickHN = JSON.stringify(options);
        }
    };
    document.getElementById('_custominterval').onchange = wme_saveQuickHNOptions;
    document.getElementById('_format').onchange = wme_saveQuickHNOptions;
    document.getElementById('_format').onfocus = function() {
        document.getElementById('_useformat').checked = true;
    }
    window.addEventListener("beforeunload", wme_saveQuickHNOptions, false);
}

function addTab()
{
    if(!document.getElementById("WME-Quick-HN") && W.selectionManager.getSelectedFeatures().length > 0 && W.selectionManager.getSelectedFeatures()[0].model.type === 'segment')
    {
        var btnSection = document.createElement('div');
        btnSection.id = 'WME-Quick-HN';
        var userTabs = document.getElementById('edit-panel');
        if (!(userTabs && getElementsByClassName('nav-tabs', userTabs)))
            return;

        var navTabs = getElementsByClassName('nav-tabs', userTabs)[0];
        if (typeof navTabs !== "undefined")
        {
            if (!getElementsByClassName('tab-content', userTabs))
                return;

            var tabContent = getElementsByClassName('tab-content', userTabs)[0];

            if (typeof tabContent !== "undefined")
            {
                newtab = document.createElement('li');
                newtab.innerHTML = '<a href="#WME-Quick-HN" id="wmequickhn" data-toggle="tab">Quick HN</a>';
                navTabs.appendChild(newtab);

                btnSection.innerHTML = '<div class="form-group">'+
                    '<h4>&nbsp;Quick House Numbers&nbsp;<sup>' + GM_info.script.version + '</sup>&nbsp;</h4>' +
                    '</br>' +
                    '<div title="House number"><b>House number </b><input type="number" id="_housenumber" style="width: 60px;"/></div>' +
                    '<div title="Custom format"><input id="_useformat" type="checkbox"> <b>Custom format </b><input id="_format" value="{%d}{%s}" style="width: 120px;"/></div>' +
                    '<div><b>{%d}</b> will be replaced with a number, <br><b>{%s}</b> will be replaced by a letter</div>' +
                    '<div>6{%s} will generate a serie: 6a, 6b, 6c, etc. <br>21/{%d}/A will generate: 21/1/A, 21/2/A, etc.</div>' +
                    '<br>'+
                    '<div>Press <b>T</b> to add <u>HN +1</u> <i>(1,2,3...)</i></div>' +
                    '<div>Press <b>R</b> to add <u>HN +2</u> <i>(1,3,5... or 2,4,6...)</i></div>' +
                    '<div>Press <b>E</b> to add <u>HN +</u><input type="number" id="_custominterval" style="width: 42px;margin-left: 6px;height: 22px;"></div>' +
                    '<div>Press <b>X</b> to add <u>HN +</u><input  id="_customalpha" value="a" style="width: 42px;margin-left: 6px;height: 22px;"> (1a, 1b, 1c...)</div>';

                btnSection.className = "tab-pane";
                tabContent.appendChild(btnSection);
            }
            else
            {
                btnSection.id='';
            }
        }
        else
        {
            btnSection.id='';
        }

        document.getElementById('_housenumber').value = counter + 1;
        document.getElementById('_housenumber').onchange = function(){
            counter = document.getElementById('_housenumber').value - 1;
            letterIndex = 0;
            updateLetterField(letterIndex);
        };
    }
}

function getElementsByClassName(classname, node) {
    if(!node)
        node = document.getElementsByTagName("body")[0];
    var a = [];
    var re = new RegExp('\\b' + classname + '\\b');
    var els = node.getElementsByTagName("*");
    for (var i=0,j=els.length; i<j; i++)
        if (re.test(els[i].className)) a.push(els[i]);
    return a;
}

function addHN()
{
    interval = 1;
    setFocus();
}

function addHN2()
{
    interval = 2;
    setFocus();
}

function addHN3()
{
    interval = document.getElementById('_custominterval').value;
    setFocus();
}

function addHN4()
{
    interval = 0;
    letterIndex = Math.max(letters.indexOf(document.getElementById('_customalpha').value), 0);
    setFocus({alpha: true});
}

function setFocus(options)
{
    $('#toolbar .add-house-number').click();
    $('#toolbar .add-house-number').click();
    var hn = getElementsByClassName("number");
    for (i=0; i<hn.length; i++)
    {
            hn[i].onfocus = function() { sethn(options); };
    }
}

function sethn(options = {}) {
    var hn = $('div.olLayerDiv.house-numbers-layer div.house-number div.content.active:not(".new") input.number');
    var letter = letters[letterIndex];
    if (options.alpha) {
        let currentNumber = document.getElementById('_housenumber').value
        hn.val(generateNumber(currentNumber, letter, options)).change();
        $("div#WazeMap").focus();
        letterIndex++;
        updadeLetterField(letterIndex);
    }
    else if (hn[0].placeholder == I18n.translations[I18n.locale].edit.segment.house_numbers.no_number && hn.val() === "")
    {
        counter = +counter + +interval;
        if (document.getElementById('_housenumber') !== null ) {
            document.getElementById('_housenumber').value = counter + 1;
            letterIndex = 0;
            updateLetterField(letterIndex);
        }
        hn.val(generateNumber(counter)).change();
        $("div#WazeMap").focus();
    }
}

function updateLetterField(index) {
    document.getElementById('_customalpha').value = letters[index];
}

function generateNumber(number, letter = "", options = {}) {
    let format;
    if (document.getElementById('_useformat').checked) {
        format = document.getElementById('_format').value
    } else {
        format = "{%d}{%s}"
    }
    return format.replace("{%s}", letter).replace("{%d}", number);

}

quickHN_bootstrap();
})();
