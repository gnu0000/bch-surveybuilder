//
// SurveyBuilder - Build a TriVox Survey (DEMO)
// This class implements the functionality for the surveybuilder page
// This page builds modules into a Survey
//
// dependencies
//    jquery, jsplumb, blockfinder.js, projectplumber.js

$(function() {
   ProjectBuilder({});
});


function ProjectBuilder() {
   var self = this;

   this.Init = function() {
      self.InitAttributes();
      self.InitEvents();
      self.InitState();
   };

   this.InitAttributes = function() {
      self.id              = 0;
      self.$pageTitle      = $("#title");
      self.$pageId         = $("#id");
      self.$toolbox        = $("#toolbox");
      self.$questionbox    = $("#queston-box");
      self.$detailsbox     = $("#details-box");
      self.$trash          = $("#trashcan");
      self.$blockSource    = $(".tblock-source");
      self.$addButton      = $(".add");
      self.$saveButton     = $("#saveproject");
      self.$renumberButton = $("#renumberproject");
      self.$validateButton = $("#validateproject");
      self.$spinner        = $("#spinner");
      self.loadModuleUrl   = "/cgi-bin/sb/module.pl?id=";
      self.saveModuleUrl   = "/cgi-bin/sb/module.pl";
      self.newIdIndex      = 1;
   };

   this.InitEvents = function() {
      $(".sources .source").draggable({
         connectToSortable: "#questions",
         helper: "clone",
         revert: "invalid",
         revertDuration: 100,
         duration: 100,
         stop: function() {self.AddQuestion(this)}
      });
      $("#questions").sortable({
         revert: 100,
         connectWith: "#trashcan",
      });
      $("#trashcan").droppable({
         drop: function(ev, ui) {ui.draggable.remove()}
      });

      self.$addButton.click(self.AddNewQuestion);
      self.$saveButton.click(self.SaveProject);
      self.$validateButton.click(self.ValidateProject);
      self.$renumberButton.click(self.RenumberProject);

      $(window).keydown(self.KeyDown);
      $(".questions").on("click", ".question, .question div", self.QuestionClick)
      $("input[name=id]"  ).change(self.setId);
      $("input[name=title").change(self.setTitle);
      $("#type-select"    ).change(self.setType);
   };

   this.InitState = function() {
      if (self.CGIParam("id")) {
         //self.LoadProject(self.CGIParam("id"));
      } else {
         self.AddNewQuestion();
      }
   };

   this.AddQuestion = function() {
      var $block = $(".questions .source");
      var id     = self.IdxString(self.newIdIndex++);
      var title  = $block.hasClass("q-type") ? "Question"   :
                   $block.hasClass("c-type") ? "Calculation":
                   $block.hasClass("e-type") ? "Evaluation" :
                   $block.hasClass("l-type") ? "Logic"      :
                                               "Unknown"    ;
      $block.removeClass("source");
      $block.css('width',"");
      $block.find(".id").text(id);
      $block.find(".title").text(title);
      $block.data("object", new Question({id:id, title:title, block:$block}));
      self.SelectQuestion($block);
   };

   this.AddNewQuestion = function() {
      $(".questions").append($(".sources .source.q-type").clone());
      return self.AddQuestion();
   };

   this.QuestionClick = function(evt) {
      var $block = $(evt.target);
      if (!$block.hasClass("question"))
         $block = $block.closest(".question");
      self.SelectQuestion($block);
   };

   this.KeyDown = function (event){
      var e = event.originalEvent;
      switch(e.which){
         case 37: return self.PromoteQuestion(event);     // left 
         case 38: return self.MoveUp(event);              // up   
         case 39: return self.DemoteQuestion(event);      // right
         case 40: return self.MoveDown(event);            // down 
         case 107:return self.self.AddNewQuestion(event); // +
      }
   };
 
   this.PromoteQuestion = function () {
      var $block = $(".questions .selected");
      $block.removeClass("child");
   };

   this.DemoteQuestion = function () {
      var $block = $(".questions .selected");
      $block.addClass("child");
   };

   this.MoveDown = function (evt) {
      var $oldQ = $(".questions .selected");
      var idx   = $oldQ.index();
      var $newQ = $(".questions li:nth-child("+(idx+2)+")");
      self.SelectQuestion($newQ);
      evt.stopPropagation();
      return false;
   };

   this.MoveUp = function (evt) {
      var $oldQ = $(".questions .selected");
      var idx   = $oldQ.index();
      var sudo  = idx>0 ? "nth-child("+(idx)+")" : "last-child";
      var $newQ = $(".questions li:"+sudo);
      self.SelectQuestion($newQ);
      evt.stopPropagation();
      return false;
   };

   this.SelectQuestion = function ($block) {
      $(".questions .selected").removeClass("selected");
      $block.addClass("selected");
      self.ShowDetails($block);
   };

   this.ShowDetails = function($block) {
      $(".question-atts").hide();
      var question = $block.data("object");
      if (!question) return;
      $(".question-atts." + question.questionType).show();
      $("input[name=id]").val(question.id);
      $("input[name=title").val(question.title);
      $("#type-select").val(question.questionType);
   };

   this.IdxString = function(val) {
      var str = "";
      if (val < 100) str += "0";
      if (val < 10 ) str += "0";
      return str += val;
   };

   this.ValidateProject = function() {
      alert("Yeah right");
   };

   this.setId = function(elt) {
      var $block = $(".questions .selected");
      var question = $block.data("object");
      question.id = $(elt.target).val();
      $block.find(".id").text(question.id);
   };

   this.setTitle = function(elt) {
   };

   this.setType = function(elt) {
      var $block = $(".questions .selected");
      var question = $block.data("object");
      question.questionType = $(elt.target).val();
      self.ShowDetails($block);
      self.Debug("settype");

   };

   this.RenumberProject = function() {
      $(".questions li").each(function(idx) {
         var id = self.IdxString(idx+1);
         $(this).data("object").id = id;
         $(this).find(".id").text(id);
      });
   }

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

   this.Debug = function(message) {
      console.log("Debug: " + message);
   };

   this.Init();
}


/////////////////////////////////////////////////////////////


function Question(options) {
   var self = this;

   this.Init = function(options) {
	   self.id           = "999";
	   self.nextQuestion = "" ;
	   self.questionType = "INFO";
	   self.text         = "This is a question" ;
	   self.title        = "Question Title";

      $.extend(self, options || {});
   };

   this.Init(options);
};
