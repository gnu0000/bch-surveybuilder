//
// ProjectPlumber
//
// This class is a wrapper for jsPlumb to interface to the ProjectBuilder
//
// external interface:
//    Init(options) 
//    InitBlocks(blocks)
//    InitSources(blocks)
//    MakeConnection(sourceId, defaultLinkId, altLinkId)
//    MakeDraggable(elements, isDeletable)
//
// options:
//    arenaId        - Id of the build area div          <required>
//    trashId        - Id of the trashcan in the toolbox <required>
//    blockDragStop  - callback when dropping a block
//    sourceDragStop - callback when dropping a block source
//    jpOptions      - any special jsPlumb setup options 
//

function ProjectPlumber(options) {
   var self = this;

   this.Init = function(options) {
      self.options = options;
      self.arena   = $(self.options.arenaId);

      var defaultJpOptions = {
         Container: self.arena,
         Anchors  : [[1,0,1,0, -16, 16], [0,0.5,-1,0]],
      };
      self.jpOptions = $.extend(defaultJpOptions, self.options.jpOptions || {});

      self.jp = jsPlumb.getInstance(self.jpOptions);
   };

   // cBlock - instance of Block class
   this.InitBlock = function(cBlock) {
      self.MakeConnectionPoints(cBlock);
   };

   // cBlock - instance of Block class
   //
   this.MakeConnectionPoints = function(cBlock){
      var dcolor = self.options.defaultLinkColor  ;
      var acolor = self.options.alternateLinkColor;

      // the source point for the default next module link
      cBlock.defaultEndpoint = self.jp.addEndpoint(cBlock.div, {
         isSource       : true,
         isTarget       : false,
         anchor         : [1,0,1,0, -16, 16],
         endpoint       : ["Dot", {radius:10}], 
         paintStyle     : {fillStyle:dcolor, linewidth:5},
         connectorStyle : {strokeStyle:dcolor, lineWidth:5},
         connectorOverlays:[["Arrow", {width:14, length:14, location:0.98}]],
      }); 

      // the source point for the alternate next module link
      cBlock.alternateEndpoint = self.jp.addEndpoint(cBlock.div, { 
         isSource       : true,
         isTarget       : false,
         anchor         : [1,1,1,0, -16, -16],
         endpoint       : ["Dot", {radius:10}], 
         paintStyle     : {fillStyle:acolor, linewidth:5},
         connectorStyle : {strokeStyle:acolor, lineWidth:5},
         connectorOverlays:[["Arrow", {width:14, length:14, location:0.98}]],
//       overlays: [["Arrow", {width:14, length:14, location:0.98}]],
      }); 

      // made the entire module div a drag target for the links
      cBlock.target = self.jp.makeTarget(cBlock.div, {
         isSource       : false,
         isTarget       : true, 
         maxConnections : 10,
         endpoint       : ["Dot", {radius:1}], 
         paintStyle     : {width:12, height:12, fillStyle:dcolor},
         anchor         : [0,0.5,-1,0],
      });
   };


   // add a wire from a specific connection point (a dot)
   // to a destination div
   this.MakeConnection = function(type, sourceEndpoint, targetId) {
      self.jp.connect({
         source  : sourceEndpoint, 
         target  : targetId      , 
         scope   : type          ,
         type    : type          ,
         overlays: [["Arrow", {width:14, length:14, location:0.98}]],
      });
   }

   this.MakeDraggable = function(elements, options) {
      self.jp.draggable(elements, options || {});
   }

   this.RemoveBlock = function(block) {
      self.jp.remove(block);
   };

   this.GetConnections = function () {
      var connections = [];
      $.each(self.jp.getConnections({scope:"*"}), function (idx, connection) {
          connections.push({
              connectionId: connection.id      ,
              sourceId:     connection.sourceId,
              targetId:     connection.targetId,
              scope:        connection.scope,
              type :        connection.endpoints[0].anchor.offsets[1] > 0 ? "main" : "alt" // a hack, until I can figure out how to do this properly
          });
      });
      return connections;
   };

   this.Init(options);
}