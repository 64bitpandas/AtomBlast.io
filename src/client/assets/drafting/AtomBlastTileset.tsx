<?xml version="1.0" encoding="UTF-8"?>
<tileset name="AtomBlastTileset" tilewidth="256" tileheight="256" tilecount="19" columns="0">
 <grid orientation="orthogonal" width="1" height="1"/>
 <terraintypes>
  <terrain name="Outside" tile="19"/>
  <terrain name="Inside" tile="4"/>
 </terraintypes>
 <tile id="1" type="Edge" terrain="0,0,1,1">
  <image width="256" height="256" source="Tiles/EdgeTile B.png"/>
  <objectgroup draworder="index">
   <object id="1" x="0" y="-1.04592" width="254.158" height="209.183"/>
  </objectgroup>
 </tile>
 <tile id="2" type="Edge" terrain="0,0,1,0">
  <image width="256" height="256" source="Tiles/InteriorCorner BL.png"/>
  <objectgroup draworder="index">
   <object id="1" x="44" y="1.10526">
    <polygon points="0,252.631 -43.1579,206.316 -43.1579,-1.05263 211.579,-0.00063 209.474,253.684"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="3" type="Edge" terrain="1,0,1,1">
  <image width="256" height="256" source="Tiles/Corner BL.png"/>
  <objectgroup draworder="index">
   <object id="1" x="45.0522" y="209.474" rotation="180">
    <polyline points="0,208.421 -2.10526,94.737 -27.3684,41.053 -58.9474,10.526 -88.4211,1.053 -212.632,0"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="4" type="Interior" terrain="1,1,1,1">
  <image width="256" height="256" source="Tiles/SolidTile.png"/>
 </tile>
 <tile id="5" type="Interior">
  <image width="256" height="256" source="Tiles/HeliumVent.png"/>
  <objectgroup draworder="index">
   <object id="1" x="127" y="35">
    <polyline points="0,0 -51,11 -71,44 -69,80 -95,110 -88,159 -33,186 42,170 93,117 85,84 97,42 57,16 -1,0"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="6" type="Interior">
  <image width="256" height="256" source="Tiles/HydrogenVent.png"/>
  <objectgroup draworder="index">
   <object id="1" x="125.602" y="34.5611">
    <polyline points="0,0 -51,11 -71,44 -69,80 -95,110 -88,159 -33,186 42,170 93,117 85,84 97,42 57,16 -1,0"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="7" type="Interior">
  <image width="256" height="256" source="Tiles/NitrogenVent.png"/>
  <objectgroup draworder="index">
   <object id="1" x="126.602" y="35.653">
    <polyline points="0,0 -51,11 -71,44 -69,80 -95,110 -88,159 -33,186 42,170 93,117 85,84 97,42 57,16 -1,0"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="8" type="Interior">
  <image width="256" height="256" source="Tiles/OxygenVent.png"/>
  <objectgroup draworder="index">
   <object id="1" x="127.556" y="35.5611">
    <polyline points="0,0 -51,11 -71,44 -69,80 -95,110 -88,159 -33,186 42,170 93,117 85,84 97,42 57,16 -1,0"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="9" type="Edge" terrain="0,1,1,1">
  <image width="256" height="256" source="Tiles/Corner BR.png"/>
  <objectgroup draworder="index">
   <object id="1" x="210.526" y="1.05263">
    <polyline points="0,0 -2.10526,113.684 -27.3684,167.368 -58.9474,197.895 -88.4211,207.368 -212.632,208.421"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="10" type="Edge" terrain="1,1,1,0">
  <image width="256" height="256" source="Tiles/Corner TL.png"/>
  <objectgroup draworder="index">
   <object id="1" x="46.4206" y="255.684" rotation="180">
    <polyline points="0,0 -2.10526,113.684 -27.3684,167.368 -58.9474,197.895 -88.4211,207.368 -212.632,208.421"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="11" type="Edge" terrain="1,1,0,1">
  <image width="256" height="256" source="Tiles/Corner TR.png"/>
  <objectgroup draworder="index">
   <object id="1" x="210.632" y="46.3158">
    <polyline points="0,208.421 -2.10526,94.737 -27.3684,41.053 -58.9474,10.526 -88.4211,1.053 -212.632,0"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="12" type="Edge" terrain="1,0,1,0">
  <image width="256" height="256" source="Tiles/EdgeTile L.png"/>
  <objectgroup draworder="index">
   <object id="1" x="46.3158" y="0" width="209.474" height="255.789"/>
  </objectgroup>
 </tile>
 <tile id="13" type="Edge" terrain="0,1,0,1">
  <image width="256" height="256" source="Tiles/EdgeTile R.png"/>
  <objectgroup draworder="index">
   <object id="1" x="1.05263" y="0" width="208.421" height="254.737"/>
  </objectgroup>
 </tile>
 <tile id="14" type="Edge" terrain="1,1,0,0">
  <image width="256" height="256" source="Tiles/EdgeTile T.png"/>
  <objectgroup draworder="index">
   <object id="1" x="1.05263" y="45.2632" width="253.684" height="209.474"/>
  </objectgroup>
 </tile>
 <tile id="15" type="Edge" terrain="0,0,0,1">
  <image width="256" height="256" source="Tiles/InteriorCorner BR.png"/>
  <objectgroup draworder="index">
   <object id="1" x="211.579" y="254.737" rotation="180">
    <polygon points="0,0 -43.1579,46.3158 -43.1579,253.684 211.579,252.632 209.474,-1.05263"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="16" type="Edge" terrain="1,0,0,0">
  <image width="256" height="256" source="Tiles/InteriorCorner TL.png"/>
  <objectgroup draworder="index">
   <object id="2" x="44.2105" y="2.10526">
    <polygon points="0,0 -43.1579,46.3158 -43.1579,253.684 211.579,252.632 209.474,-1.05263"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="17" type="Edge" terrain="0,1,0,0">
  <image width="256" height="256" source="Tiles/InteriorCorner TR.png"/>
  <objectgroup draworder="index">
   <object id="1" x="211.632" y="254.737" rotation="180">
    <polygon points="0,252.631 -43.1579,206.316 -43.1579,-1.05263 211.579,-0.00063 209.474,253.684"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="18">
  <image width="256" height="256" source="Tiles/CarbonSource.png"/>
  <objectgroup draworder="index">
   <object id="1" x="127.421" y="34.8421">
    <polyline points="0,0 -51,11 -71,44 -69,80 -95,110 -88,159 -33,186 42,170 93,117 85,84 97,42 57,16 -1,0"/>
   </object>
  </objectgroup>
 </tile>
 <tile id="19" type="Exterior" terrain="0,0,0,0">
  <image width="256" height="256" source="Tiles/Outside.png"/>
 </tile>
</tileset>
