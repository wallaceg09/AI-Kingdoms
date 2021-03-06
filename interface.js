"use strict";

var Ui = {
	ShowObject      : false,
	CurrentObject   : null,
	MapMode         : "realms"
};

function UpdateSize()
{
	var elements = document.querySelectorAll("#sidebar section");
	for (var i = 0; i < elements.length; i++)
		elements[i].style["height"] = window.innerHeight-20+"px";
	var objinfo = document.getElementById("object-info");
	objinfo.style["height"] = window.innerHeight-30+"px";
}

function DisplayObject(obj, noScroll)
{
	Ui.ShowObject = true;
	Ui.CurrentObject = obj;
	SetActiveTab(document.getElementById("object-info-tab"));
	UpdateUI();
	
	if(!noScroll)
	{
		if(obj.hasOwnProperty("X"))
		{
			var w = playfield.clientWidth;
			var h = playfield.clientHeight;
			playfield.scrollLeft = obj.X - w/2;
			playfield.scrollTop  = obj.Y - h/2;
		}
	}

	try
	{
		history.pushState(Ui, null);
	}
	catch(e)
	{
	}
}

function SetMapMode(mode)
{
	Ui.MapMode = mode;
	history.pushState(Ui, null);
	GameRedraw();
}

function CreateSymbol(symbol)
{
	var span = document.createElement('span');
	span.className = "symbol "+symbol;
	return span;
}

function CreateLinkFor(obj)
{
	var	element = null;
	var isCharacter = obj.hasOwnProperty("Gender");
	var isCity = obj.hasOwnProperty("Population");
	var isFaction = obj.hasOwnProperty("Cities");
	// Character
	if((isCharacter && obj.isRelevant()) || !isCharacter)
	{
		element = document.createElement('a');
		element.className = "objectLink";

		var onClick = DisplayObject.bind(undefined, obj, false);
		element.addEventListener('click', onClick);
	}
	else
	{
		element = document.createElement('span');
		element.className = "objectLink unimportant";
	}

	if(isCharacter)
		element.innerHTML = obj.Surname+' '+obj.Name;
	else
		element.innerHTML = obj.Name;

	if(isCharacter && !obj.IsAlive)
		element.appendChild(CreateSymbol("dead"));
	element.appendChild(CreateSymbol(obj.Gender));
	if(obj.Rank)
		element.appendChild(CreateSymbol(obj.Rank.Name));
	if(isCity)
		element.appendChild(CreateSymbol("city"));

	if(isFaction)
	{
		element.style.color = "rgb("+obj.Color[0]+", "+obj.Color[1]+", "+obj.Color[2]+")";
		element.className += " faction"; 
		if(ColorIsDark(obj.Color))
			element.className += " dark"; 
	}
	
	return element;
}

function CreateTag(obj)
{
	var div = document.createElement('div');
	div.className = 'tag';
	if(typeof(obj) == 'object')
	{
		if(obj instanceof City || obj instanceof Faction || obj instanceof Character)
			div.appendChild(CreateLinkFor(obj));
		else
		{
			div.innerHTML = obj.Name;
			div.appendChild(CreateSymbol("level-"+Math.floor(obj.Level)));
		}
	}
	else
		div.innerHTML = obj;
	return div;
}

function CreateDoubleTag(text, obj)
{
	var div = document.createElement('div');
	div.className = 'double-tag';
	var spanA = document.createElement('span');
	var spanB = document.createElement('span');
	spanA.innerHTML = text;
	spanB.appendChild(CreateLinkFor(obj));
	div.appendChild(spanA);
	div.appendChild(spanB);
	return div;
}

function OnBack(e)
{
	if(e.state)
		Ui = e.state;
	else
	{
		Ui.ShowObject = false;
		Ui.CurrentObject = null;
		Ui.MapMode = 'realms';
	}
	UpdateUI();
	window.requestAnimationFrame(GameLoop);
}
window.onpopstate = OnBack;

function OnClick(click)
{
	var map = document.getElementById("playfield");
	var pos = {X: click.clientX, Y: click.clientY};
	var mapPos = {X: map.offsetLeft, Y: map.offsetTop};
	var scrollPos = { X: map.scrollLeft, Y: map.scrollTop };
	pos = Vec2Add(pos, Vec2Neg(mapPos));
	pos = Vec2Add(pos, scrollPos);
	var city = ProximityTestPointPoint(pos, GameState.Map.Cities, 50);
	if(city)
		DisplayObject(city, true);
}

function SetActiveTab(tab)
{
	var parent = tab.parentNode;
	var elements = parent.querySelectorAll("section");
	for(var i = 0; i < elements.length; i++)
	{
		elements[i].className = "";
	}
	tab.className = "active-tab";
}

function InitUI()
{
	var elements = document.querySelectorAll(".tabbed section h2 a");
	for (var i = 0; i < elements.length; i++)
		elements[i].addEventListener("click", SetActiveTab.bind(undefined, elements[i].parentNode.parentNode));

	/*var controls = document.getElementById("controls");
	controls.innerHTML = "";

	var symbol = CreateSymbol("Strength");
	symbol.addEventListener('click', SetMapMode.bind(undefined, 'realms'));
	controls.appendChild(symbol);

	var symbol = CreateSymbol("Tactic");
	symbol.addEventListener('click', SetMapMode.bind(undefined, 'factions'));
	controls.appendChild(symbol);*/

	var map = document.getElementById("map");
	map.addEventListener("click", OnClick);
}

function UpdateUI()
{
	var objinfo = document.getElementById("object-info");
	objinfo.innerHTML = "";
	if(Ui.ShowObject)
	{
		var obj = Ui.CurrentObject;
		var isCharacter = obj.hasOwnProperty("Gender");
		var isCity = obj.hasOwnProperty("Population");
		var isFaction = obj.hasOwnProperty("Cities");

		var faction = null;
		if(isFaction)
		{
			faction = obj;
		}
		else
		{
			faction = obj.Faction;
			while(Ui.MapMode == "realms" && faction.ParentFaction)
				faction = faction.ParentFaction;
		}

		var ribbon = document.createElement('div');
		ribbon.className = "section ribbon";
		ribbon.style.backgroundColor = "rgb("+faction.Color[0]+", "+faction.Color[1]+", "+faction.Color[2]+")";

		var title = document.createElement('div');
		if(isCharacter)
			title.innerHTML = obj.Surname+' '+obj.Name;
		else
			title.innerHTML = obj.Name;
		title.className = "title";
		ribbon.appendChild(title);
		objinfo.appendChild(ribbon);

		var misc = document.createElement('div');
		misc.className = "section misc";
		if(obj.Home)          misc.appendChild(CreateDoubleTag("Home",          obj.Home));
		if(obj.Faction)       misc.appendChild(CreateDoubleTag("Faction",       obj.Faction));
		if(obj.ParentFaction) misc.appendChild(CreateDoubleTag("Controlled by", obj.ParentFaction));
		if(obj.Capital)       misc.appendChild(CreateDoubleTag("Capital",       obj.Capital));
		if(obj.Leader)        misc.appendChild(CreateDoubleTag("Leader",        obj.Leader));
		if(obj.Governor)      misc.appendChild(CreateDoubleTag("Governor",      obj.Governor));
		objinfo.appendChild(misc);

		if(isCharacter)
		{
			var subtitle = document.createElement('span');
			subtitle.innerHTML = obj.Rank.Name+', '+obj.Age;
			subtitle.className = "subtitle";

			if(!obj.IsAlive)
				subtitle.appendChild(CreateSymbol("dead"));
			subtitle.appendChild(CreateSymbol(obj.Gender));

			ribbon.appendChild(subtitle);

			var statsTable = HtmlTableFromArray([[CreateSymbol("Strength"), CreateSymbol("Tactic"), CreateSymbol("Charisma"), CreateSymbol("Intrigue"), CreateSymbol("Willpower")], obj.Stats]);
			statsTable.className = "section stats";
			objinfo.appendChild(statsTable);

			var traits = document.createElement('div');
			traits.className = "section traits";
			for(var i = 0; i < obj.Traits.length; i++)
			{
				var trait = obj.Traits[i];
				traits.appendChild(CreateTag(trait));
			};
			objinfo.appendChild(traits);

			var skills = document.createElement('div');
			skills.className = "section skills";
			for(var i = 0; i < obj.Skills.length; i++)
			{
				var skill = obj.Skills[i];
				skills.appendChild(CreateTag(skill));
			};
			objinfo.appendChild(skills);

			var relations = document.createElement('div');
			relations.className = "section relations";
			for(var i = 0; i < obj.Relations.length; i++)
			{
				var rel = obj.Relations[i];
				relations.appendChild(CreateDoubleTag(rel[0], rel[1]));
			};
			objinfo.appendChild(relations);
		}
		else if(isCity)
		{
			var population = document.createElement('div');
			population.className = "section population";
			obj.Population.map(
			function(person){
				if(!(person.IsAlive)) return;
				population.appendChild(CreateTag(person));
			}
			);
			objinfo.appendChild(population);
		}
		else if(isFaction)
		{
			var subs = document.createElement('div');
			subs.className = "section subs";
			obj.SubFactions.map(function(faction){ subs.appendChild(CreateTag(faction)); });
			objinfo.appendChild(subs);

			var cities = document.createElement('div');
			cities.className = "section cities";
			obj.Cities.map(
			function(city){
				cities.appendChild(CreateTag(city));
			}
			);
			objinfo.appendChild(cities);

			var members = document.createElement('div');
			members.className = "section members";
			GameState.Characters.map(
			function(person){
				if(!(person.IsAlive)) return;
				if(person.Faction != obj) return;
				members.appendChild(CreateTag(person));
			}
			);
			objinfo.appendChild(members);
		}

	}
	else
	{
		GameState.Factions.map(function(faction)
		{
			if(!faction.ParentFaction)
				objinfo.appendChild(CreateTag(faction));
		});
	}
}