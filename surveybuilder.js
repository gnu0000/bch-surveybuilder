//
// SurveyBuilder - Build a TriVox Survey (DEMO)
// This class implements the functionality for the surveybuilder page
// This page builds modules into a Survey
//
// dependencies
//    jquery, jsplumb, blockfinder.js, projectplumber.js

$(function() {
   jQuery.fn.extend({
       disable: function(state) {
           return this.each(function() {
               this.disabled = state;
           });
       }
   });
   ProjectBuilder({});
});


function ProjectBuilder() {
   var self = this;

   this.Init = function() {
      self.InitAttributes();
      self.InitEvents();
      self.LoadProject(self.CGIParam("id"));
   };

   this.InitAttributes = function() {
      self.id                 = 0;
      self.$pageTitle         = $("#title")                ;  // the page title
      self.$pageId            = $("#id")                   ;  // the page title
      self.$arena             = $("#arena")                ;  // the build area div
      self.$toolbox           = $("#toolbox")              ;  // the toolbox
      self.$trash             = $("#trashcan")             ;  // the trashcan in the toolbox
      self.$newBlockSource    = $("#new-block-source")     ;  // identify block-sources in the toolbox 
      self.$propForm          = $("#moduleproperties")     ;  // module properties form
      self.$saveButton        = $("#saveproject")          ;  // save button for the survey
      self.$validateButton    = $("#validateproject")      ;  // validate button for the survey
      self.$spinner           = $("#spinner")              ;  // the spinner (todo)
      self.finderInputSel     = "#finderinput"             ;  // Selector of the Finder input element
      self.finderResultsSel   = "#finderresults"           ;  // Selector of the Finder results div
      self.finderImageSel     = "#finderimage"             ;  // Selector of the Finder loading spinner
      self.defaultLinkColor   = "#1b4063"                  ;  // Color for default links and connectors
      self.alternateLinkColor = "#AAA"                     ;  // Color for alternate links and connectors
      self.finderCallback     = self.FinderChange          ;  // Function to call after finder finds stuff
      self.loadProjectUrl     = "/cgi-bin/sb/survey.pl?id=";  // URL to fetch the project (Survey)
      self.saveProjectUrl     = "/cgi-bin/sb/survey.pl"    ;  // URL to save the project (Survey)
      self.findBlockUrl       = "/cgi-bin/sb/module.pl?match="; // URL to find the blocks (Modules)
      self.newIdIndex         = 1;
   };

   this.InitEvents = function() {
      self.finder = new BlockFinder({
         inputSel   : self.finderInputSel  ,       
         resultsSel : self.finderResultsSel,
         imageSel   : self.finderImageSel  ,
         changed    : self.finderCallback  ,
         searchUrl  : self.findBlockUrl
      });
      self.plumber = new ProjectPlumber($.extend({}, self, {
         blockDragStop  : self.BlockDragStop ,
         sourceDragStop : self.SourceDragStop,
      }));
      self.InitToolbox();
      self.MakeDraggable(self.$propForm, false);
      self.$propForm.find("input").change(self.ModEditChange);
      self.$propForm.find("input").keyup(self.ModEditChange);
      self.$propForm.find(".done").click(self.ModEditDone);
      self.$propForm.find(".module-builder").click(self.EditModule);
      self.$saveButton.click(self.SaveProject);
      self.$validateButton.click(self.ValidateProject);
      $(window).keydown(self.KeyDown).keyup(self.KeyUp);
   };

   this.InitToolbox = function() {
      // allow toolbox to be moved around
      self.MakeDraggable(self.$toolbox, false);
      // allow "New Block" source to be copy/dropped      
      self.MakeSourceable(self.$newBlockSource);
   };

   // allow the things to be dragged around
   this.MakeDraggable = function(elements, isDeletable) {
      var options = isDeletable ? {stop: self.BlockDragStop} : {};
      self.plumber.MakeDraggable(elements, options);
   };
   
   // allow the toolbox items to be cloned and dragged
   this.MakeSourceable = function(elements) {
      self.plumber.MakeDraggable(elements, {
         clone:true,
         stop: self.ToolDragStop 
      });
   };

   this.LoadProject = function(surveyId) {
      if (!surveyId)
         return;
      $.ajax({
         url:  self.loadProjectUrl + surveyId,
         type: 'GET'
      })
      .done(self.BuildProject)
      .fail(self.AjaxError);
   };


   this.BuildProject = function(data) {
      var defaultOptions = {
         source  : self.$newBlockSource, // div to clone from
         arena   : self.$arena         ,
         plumber : self.plumber        , 
         id      : "*label*"           ,
         edit    : self.EditBlock      
      }
      self.projectData = data;
      self.$pageTitle.text(data.name);
      self.$pageId.text(data.id);
      self.id = data.id;
      self.newIdIndex = data.newIdIndex || 1;
      for (var blockId in data.blocks) {
         var cBlock = new Block($.extend({}, defaultOptions, data.blocks[blockId]));
         self.MakeDraggable(cBlock.div, true);
      }
      self.MakeConnections();
   };

   this.AjaxError = function(xhr, error) {
      alert ("Ajax Error: " + error);
   };

   this.MakeConnections = function(){
      var blocks = $('.block');
      blocks.each(function(){
         var cBlock = $(this).data("object");
         cBlock.Connect();
      });
   };

   this.SaveProject = function() {
      self.ShowSpinner(true);
      var blocks = self.GatherBlockData();
      self.title = self.$pageTitle.text();
      self.id    = self.$pageId.text();
      var survey = JSON.stringify({id:self.id, name:self.title, newIdIndex:self.newIdIndex, blocks:blocks});
      $.ajax({
         url:  self.saveProjectUrl,
         type: 'POST',
         data: {survey:survey, id:self.id}
      })
      .done(self.SetProjectID)
      .fail(self.AjaxError)
      .always(self.AjaxComplete);
   };

   this.GatherBlockData = function() {
      var blocks = {};
      $(".block").each(function() {
         var block = $(this);
         var id    = block.attr('id');
         var label = block.find(".label").text();
         var name  = block.find(".name").text();
         var cond  = block.find(".cond").text();
         var isnew = block.data("isnew");
         var pos   = self.round(block.position());
         blocks[id] = {id:id, label:label, name:name, cond:cond, top:pos.top, left:pos.left, isnew:isnew};
      });
      $(self.plumber.GetConnections()).each(function() {
         var key = this.type == "alt" ? "altlink" : "defaultlink";
         blocks[this.sourceId][key] = this.targetId;
      });
      return blocks;
   };

   this.SetProjectID = function(data) {
      self.id = data.id;
      self.$pageId.text(data.id);
   };

   this.AjaxError = function(xhr, error) {
      alert ("Ajax Error: " + error);
   };

   this.AjaxComplete = function() {
      self.ShowSpinner(false);
   };

   // when the finder returns its matching modules we want them to be draggable onto the arena, hence this callback
   this.FinderChange = function(container) {
      self.MakeSourceable(container.find(".block-source"));
   };

   this.ToolDragStop  = function(event, ui) {
      var source  = $(event.selection[0][0]);
      var isnew   = source.find(".label").text() == "";
      var label   = source.find(".label").text() || "M" + self.newIdIndex++;

      var metrics = self.ElementMetrics(source);
      var cBlock = new Block({
         source  : source      ,
         arena   : self.$arena  ,
         label   : label       ,
         top     : metrics.top ,
         left    : metrics.left,
         plumber : self.plumber, 
         edit    : self.EditBlock,
         isnew   : isnew
      });       
      self.MakeDraggable(cBlock.div, true);
   };

   this.BlockDragStop = function(event, ui) {
      var block = $(event.el);
      if (self.IsOverTrashcan(block)){
         window.setTimeout(function() {self.RemoveBlock(block)}, 100);
      }
   };

   this.IsOverTrashcan = function(block) {
      return self.IsIntersecting(block, self.$trash);
   };

   this.RemoveBlock = function(block) {
      self.plumber.RemoveBlock(block);
   };

   this.EditBlock = function(elt) {
      self.editblock = $(elt.target).closest(".block").data("object");
      $("#modulelabel").val(self.editblock.label).disable(!self.editblock.isnew);
      $("#modulename" ).val(self.editblock.name).disable(!self.editblock.isnew);
      $("#modulecond" ).val(self.editblock.cond);
      $(".module-builder").disable(!self.editblock.isnew);

      self.$propForm.show();
   };

   this.ModEditChange = function(elt) {
      var target = $(elt.target);
      var props = {};
      props[target.attr("name")] = target.val();
      self.editblock.SetProperties(props);
   };

   this.ModEditDone = function() {
      self.$propForm.hide();
   };

   this.EditModule = function(elt) {
      var win = window.open("modulebuilder.html?survey="+self.id+"&moduleid="+self.editblock.label, "_blank");
      win.focus();
   };

   this.KeyDown = function (event){
      if (event.originalEvent.which == 27) 
         self.ModEditDone();
   };

   this.SurveyEditChange = function() {
      self.title = $self.pageTitle.text();
      self.id    = $self.pageId.text();
   };

   this.ValidateProject = function() {
      alert("Yeah right");
   };

   // util fns follow
   this.CGIParamExists = function(name) {
      return (self.CGIParam(name) !== undefined);
   };
   
   this.CGIParam = function(name) {
      var url     = document.location.href;
      name        = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
      var regexS  = "[\\?&amp;]" + name + "=([^&amp;#]*)";
      var regex   = new RegExp(regexS);
      var results = regex.exec(url);
      if (results == null) return undefined;
      return results[1];
   };

   this.IsIntersecting = function(element1, element2) {
      var m1 = self.ElementMetrics(element1);
      var m2 = self.ElementMetrics(element2);
      if (m1.top    > m2.bottom ||
          m1.bottom < m2.top    ||
          m1.left   > m2.right  ||
          m1.right  < m2.left   )
         return false;
      return true;
   };   

   this.ElementMetrics = function(element) {
      var metrics    = $(element).offset(); // top and left
      var offset     =  self.$arena.offset();
      metrics.top   -= offset.top;
      metrics.left  -= offset.left;
      metrics.width  = $(element).width();
      metrics.height = $(element).height();
      metrics.bottom = metrics.top  + metrics.height;
      metrics.right  = metrics.left + metrics.width ;
      return metrics;                 
   };

   this.ShowSpinner = function(show) {
      show ? self.$spinner.show() : self.$spinner.hide();
   };

   this.round = function(obj) {
      obj.top  = Math.round(obj.top );
      obj.left = Math.round(obj.left);
      return obj;
   };

   this.Init();
};


//////////////////////////////////////////////////////////////////////////////////////
//
// Block - a class representing a module in the surveybuilder.
//   Basically, its a rounded box div that you drag around, attach arrows etc.
//
// options:
//   source      - template to clone                      <required>
//   arena       - the containing div where stuff happens <required>
//   plumber     - plumber class                          <required>
//   id          - id of new div
//   label       - label for new div
//   name        - name for new div
//   top         - top of div in px
//   left        - left of div in px
//   defaultlink - id of default target link
//   altlink     - id of alternate target link
//
// options2: - another place to put the above options,
//             i got this idea from jsPlumb.
//
function Block(options) {
   var self = this;

   this.Init = function(options) {
      self.label       = "B00";
      self.name        = ""   ;
      self.cond        = ""   ;
      self.top         = 50   ;
      self.left        = 50   ;
      self.defaultlink = ""   ;
      self.altlink     = ""   ;
      self.isnew       = true ;
      self.edit        = function(){};

      $.extend(self, options || {});
      self.Build();  
      self.Plumb();            
      self.div.find(".label").click(self.edit);
      self.div.data("object", self); // dom element points to its object
   };


   // clone new div from src, set attributes, attach to dom, set position
   this.Build = function() {
      self.div = self.source.clone();
      self.div.removeClass("jsplumb-draggable jsplumb-dragged block-source");
      self.div.addClass("block");
      self.div.attr("id", self.GetNewId());
      if (!self.name)
         self.name = self.div.find(".name" ).text();
      self.div.data("isnew", self.isnew);
      self.SetProperties({});
      self.div.css({top:self.top, left:self.left
      });
      self.arena.append(self.div);
   };

   this.GetNewId = function() {
      if (!self.id) {
         var n1 = Math.floor((Math.random() * 1000) + 1);
         var n2 = Math.floor((Math.random() * 1000) + 1);
         self.id = "block_" + n1 + n2;
      }
      if (self.id == "*label*") {
         self.id = self.label;
      }
      return self.id;
   };

   this.SetProperties = function(props) {
      $.extend(self, props);
      self.div.find(".label").text(self.label);
      self.div.find(".name" ).text(self.name);
      self.div.find(".cond" ).text(self.cond);
   };

   // let jsPlumb do whatever it needs to make a block plumbable
   this.Plumb = function() {
      self.plumber.InitBlock(self);
   };


   // draw the lines that come from this block - delay until all blocks are built
   this.Connect = function() {
      if (self.defaultlink)
         self.plumber.MakeConnection("default", self.defaultEndpoint, self.defaultlink);
      if (self.altlink)
         self.plumber.MakeConnection("alternate", self.alternateEndpoint, self.altlink);
   };


   this.Init(options);
};