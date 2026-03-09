const styles = `
:root{
  --bg:#f7eee7;
  --rose:#d88e8f;
  --gold:#d8a35d;
  --brown:#6f4f42;
  --text:#4d3c34;
  --white:rgba(255,255,255,.88);
  --line:rgba(111,79,66,.12);
  --shadow:0 14px 40px rgba(111,79,66,.14);
  --soft:#f3e7df;
  --success:#2c8b57;
  --error:#b94141;
}

*{box-sizing:border-box;margin:0;padding:0}

body{
  font-family:Inter,system-ui,sans-serif;
  color:var(--text);
  background:
    linear-gradient(rgba(247,238,231,.9), rgba(247,238,231,.9)),
    url("DESIGN NI JARED.png") center/cover fixed no-repeat;
  min-height:100vh;
  padding:24px;
}

.wardrobe-container{
  max-width:1280px;
  margin:0 auto;
}

.wardrobe-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  flex-wrap:wrap;
  background:var(--white);
  border:1px solid var(--line);
  border-radius:28px;
  padding:20px 24px;
  box-shadow:var(--shadow);
  margin-bottom:22px;
}

.brand{
  display:flex;
  align-items:center;
  gap:14px;
}

.brand-logo{
  width:60px;
  height:60px;
  object-fit:cover;
  border-radius:18px;
  background:#fff;
}

.brand h1{
  font-size:28px;
  font-family:"Playfair Display", serif;
  color:var(--brown);
}

#username{
  display:block;
  font-size:14px;
  font-weight:700;
  color:var(--rose);
  margin-top:4px;
}

.header-nav{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

.header-link{
  text-decoration:none;
  color:var(--brown);
  font-weight:700;
  background:#fff;
  border:1px solid var(--line);
  border-radius:999px;
  padding:10px 16px;
}

.wardrobe-main{
  display:grid;
  grid-template-columns:1.35fr .85fr;
  gap:22px;
  margin-bottom:22px;
}

.daily-outfit-section,
.generation-panel,
.drawer-panel{
  background:var(--white);
  border:1px solid var(--line);
  border-radius:28px;
  box-shadow:var(--shadow);
}

.daily-outfit-section{
  padding:24px;
}

.daily-outfit-header,
.drawer-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:18px;
}

.daily-outfit-header h2,
.generation-panel h2,
.drawer-header h2{
  font-family:"Playfair Display", serif;
  color:var(--brown);
}

.daily-outfit-display{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:18px;
}

.outfit-slot{
  background:#fff;
  border:1px solid var(--line);
  border-radius:22px;
  padding:16px;
}

.slot-label{
  font-weight:800;
  color:var(--brown);
  margin-bottom:10px;
}

.slot-content{
  min-height:170px;
  border-radius:18px;
  background:var(--soft);
  border:1px dashed rgba(111,79,66,.18);
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  margin-bottom:12px;
}

.slot-content img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.empty-slot{
  color:#8a7163;
  font-size:14px;
  text-align:center;
  padding:12px;
}

.generation-panel{
  padding:24px;
}

.form-group{
  margin-bottom:14px;
}

label{
  display:block;
  margin-bottom:7px;
  font-weight:700;
  font-size:14px;
}

input,
select{
  width:100%;
  padding:14px 16px;
  border:1px solid var(--line);
  border-radius:16px;
  background:#fff;
  font-size:15px;
  outline:none;
}

.btn-primary,
.btn-secondary,
.select-from-drawer-btn,
.item-actions button{
  border:none;
  border-radius:999px;
  padding:12px 18px;
  font-weight:800;
  cursor:pointer;
  transition:.2s ease;
}

.btn-primary{
  background:linear-gradient(135deg,var(--gold),var(--rose));
  color:#fff;
}

.btn-secondary{
  background:#fff;
  color:var(--brown);
  border:1px solid var(--line);
}

.select-from-drawer-btn{
  width:100%;
  background:#fff;
  color:var(--brown);
  border:1px solid var(--line);
}

.full-width{
  width:100%;
}

.btn-primary:hover,
.btn-secondary:hover,
.select-from-drawer-btn:hover,
.item-actions button:hover{
  transform:translateY(-1px);
}

.status-message{
  min-height:22px;
  margin-top:12px;
  font-size:14px;
  font-weight:700;
}

.status-message.success{color:var(--success)}
.status-message.error{color:var(--error)}

.category-section{
  display:grid;
  grid-template-columns:220px 1fr;
  gap:22px;
}

.category-tabs{
  background:var(--white);
  border:1px solid var(--line);
  border-radius:28px;
  box-shadow:var(--shadow);
  padding:16px;
  display:flex;
  flex-direction:column;
  gap:10px;
  height:max-content;
}

.category-tab{
  border:none;
  border-radius:18px;
  padding:14px 16px;
  text-align:left;
  font-weight:800;
  cursor:pointer;
  background:var(--soft);
  color:var(--brown);
}

.category-tab.active{
  background:linear-gradient(135deg,var(--gold),var(--rose));
  color:#fff;
}

.drawer-panel{
  padding:24px;
}

.wardrobe-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:18px;
}

.item-card{
  background:#fff;
  border:1px solid var(--line);
  border-radius:22px;
  overflow:hidden;
  box-shadow:0 6px 18px rgba(111,79,66,.08);
}

.item-image{
  width:100%;
  height:220px;
  background:var(--soft);
}

.item-image img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.item-body{
  padding:14px;
}

.item-style{
  display:inline-block;
  background:#f4e6dd;
  color:var(--brown);
  border-radius:999px;
  padding:6px 10px;
  font-size:12px;
  font-weight:800;
  margin-bottom:10px;
}

.item-description{
  font-size:14px;
  line-height:1.55;
  min-height:44px;
  margin-bottom:12px;
}

.item-actions{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}

.item-actions button{
  flex:1;
  min-width:90px;
  background:#fff;
  color:var(--brown);
  border:1px solid var(--line);
}

.modal{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.32);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:20px;
  z-index:30;
}

.modal.hidden{
  display:none;
}

.modal-content{
  width:100%;
  max-width:440px;
  background:var(--white);
  border:1px solid var(--line);
  border-radius:26px;
  box-shadow:var(--shadow);
  padding:24px;
  position:relative;
}

  .close-btn{
  position:absolute;
  top:12px;
  right:14px;
  font-size:28px;
  background:none;
  border:none;
  cursor:pointer;
  color:var(--brown);
}
`;