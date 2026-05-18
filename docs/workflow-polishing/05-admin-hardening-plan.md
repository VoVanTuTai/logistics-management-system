# Ke hoach Admin Hardening truoc bao cao do an

> **Muc tieu:** Bo sung cac diem thieu quan trong cua phan Admin de khi bao cao it bi bat loi ve nghiep vu va ky thuat: phan quyen that, audit log, dashboard co so lieu, xoa mem, validation danh muc, session refresh va test smoke.

Tai lieu nay duoc thiet ke de lam tung phan rieng biet. Moi prompt ben duoi co **pham vi file rieng**, tranh viec vibe nhieu agent/nhieu lan lam de len nhau.

---

## 1. Nguyen tac lam viec

- Lam theo tung wave, moi wave nen tao mot branch/commit rieng.
- Truoc moi wave chay `git status --short` de biet file nao dang co thay doi.
- Khong sua cung luc `RBAC`, `audit`, `dashboard`, `soft delete` trong mot prompt.
- Frontend-only wave khong sua backend. Backend wave khong nắn UI neu khong can.
- Neu co xung dot voi thay doi dang co, giu thay doi hien tai va bao lai thay vi revert.
- Sau moi wave chay toi thieu `npx tsc --noEmit` trong app/service lien quan. Chi chay `npm run build` neu node_modules/Rollup optional dependency on dinh.

---

## 2. Thu tu uu tien

| Uu tien | Hang muc | Ly do | Ket qua can co |
|--------|----------|-------|----------------|
| P0 | Backend hoa RBAC courier-mobile | Lo hong lon nhat: localStorage khong enforce server-side | Quyen luu backend, gateway/courier endpoint co check |
| P0 | Audit log thao tac admin | Admin co quyen cao, can truy vet ai sua gi | Co bang/API audit va ghi log user/hub/zone/config/NDR |
| P1 | Dashboard admin dung du lieu that | Trang tong quan hien con tinh | KPI lay tu API hien co |
| P1 | Disable/soft delete | Logistics khong nen xoa cung du lieu da phat sinh | Nut xoa doi thanh vo hieu hoa/an toan |
| P1 | Validation danh muc | Giam loi nghiep vu khi tao hub/zone/config | Validate unique, cycle, JSON schema, dia chi |
| P2 | Session refresh | TODO con de lai trong auth.session.ts | Het han token thi refresh/logout dung cach |
| P2 | Don file thua + text tieng Viet | Giam cau hoi "code rac" khi bao cao | Xoa file mistake, dong bo text |
| P2 | Smoke tests admin | Chung minh luong chinh khong vo | Test login guard, CRUD/user/hub, save permission |

---

## 3. Chia wave de khong de len nhau

| Wave | Ten | Pham vi so huu file | Khong duoc sua |
|------|-----|----------------------|----------------|
| 0 | Cleanup an toan | `apps/admin-web/src/features/permissions/adminPermissions.ts`, `apps/admin-web/src/store/permissionStore.ts`, `apps/admin-web/src/pages/permissions/AdminAuthorizationPage.tsx`, route/import lien quan neu co | Backend, dashboard, user/hub CRUD |
| 1 | Dashboard KPI that | `apps/admin-web/src/pages/dashboard/AdminDashboardPage.tsx`, CSS lien quan neu can, `apps/admin-web/src/features/*` chi doc/bo sung hook nho | RBAC permission page, backend schema |
| 2 | Soft delete/disable | `UserManagementPage.tsx`, `MerchantUsersPage.tsx`, `HubManagementPage.tsx`, client API lien quan neu can | Dashboard, permission matrix |
| 3A | Validation frontend | Cac page masterdata admin: hub/zone/config/NDR | Backend Prisma, RBAC |
| 3B | Validation backend | `services/masterdata-service/**`, co the them DTO/helper validation | Admin UI khong lien quan |
| 4A | RBAC backend contract | `services/auth-service/**` hoac service duoc chon lam permission source | Admin UI, courier UI |
| 4B | RBAC admin integration | `CourierPermissionMatrixPage.tsx`, `courierPermissionMatrix.ts`, auth/admin API client | Gateway enforcement |
| 4C | RBAC enforcement | `services/gateway-bff/**`, `apps/courier-mobile/**` permission fetch/cache | Admin dashboard |
| 5A | Audit backend | `services/auth-service/**`, `services/masterdata-service/**` | Admin UI ngoai audit viewer |
| 5B | Audit viewer optional | `apps/admin-web/src/pages/audit/**`, route/navigation | Service CRUD logic |
| 6 | Session refresh | `apps/admin-web/src/features/auth/**`, `apps/admin-web/src/services/api/client.ts`, auth store | Masterdata pages |
| 7 | Smoke tests | Test files/scripts only | Feature implementation |

---

## 4. Prompt Wave 0 - don file thua - DONE

**Muc tieu:** Xoa cac file da ghi ro "created by mistake and should be deleted" va dam bao khong con import/route treo.

```text
Ban dang lam trong repo logistics-management-system. Hay thuc hien Wave 0 Admin cleanup.

Pham vi duoc sua:
- apps/admin-web/src/features/permissions/adminPermissions.ts
- apps/admin-web/src/store/permissionStore.ts
- apps/admin-web/src/pages/permissions/AdminAuthorizationPage.tsx
- Cac file route/import chi khi can go bo tham chieu den 3 file tren.

Yeu cau:
1. Tim toan bo import/reference den 3 file tren bang rg.
2. Neu chung that su khong duoc dung, xoa file va xoa import/route treo.
3. Khong sua CourierPermissionMatrixPage va khong sua backend.
4. Chay:
   cd apps/admin-web
   npx tsc --noEmit
5. Bao cao file da xoa/sua va neu co route nao bi anh huong.

Commit goi y:
chore(admin-web): remove unused permission prototype files
```

**Tieu chi xong:**
- `rg "AdminAuthorizationPage|adminPermissions|permissionStore" apps/admin-web/src` khong con ket qua sai.
- `npx tsc --noEmit` pass trong `apps/admin-web`.

### Bao cao Wave 0 - Admin cleanup

**Trang thai:** Hoan thanh.

**Thay doi da lam:**
- Da kiem tra reference bang `rg "AdminAuthorizationPage|adminPermissions|permissionStore" apps/admin-web/src`.
- Khong tim thay import, route hoac usage nao den 3 file prototype.
- Da xoa 3 file thua:
  - `apps/admin-web/src/features/permissions/adminPermissions.ts`
  - `apps/admin-web/src/store/permissionStore.ts`
  - `apps/admin-web/src/pages/permissions/AdminAuthorizationPage.tsx`

**Tac dong nghiep vu/ky thuat:**
- Giam code rac trong phan admin permissions.
- Tranh bi hoi ve cac file prototype khong dung khi review/báo cáo.
- Khong thay doi hanh vi runtime vi cac file nay khong duoc import.

**Kiem chung:**
- `rg "AdminAuthorizationPage|adminPermissions|permissionStore" apps/admin-web/src`: khong con ket qua.
- `cd apps/admin-web && npx tsc --noEmit`: pass.

---

## 5. Prompt Wave 1 - dashboard admin dung du lieu that - DONE

**Muc tieu:** Thay the cac so lieu tinh bang KPI lay tu API hien co: user theo role/status, hub active/inactive, zone active, NDR reason active, config count, merchant count.

```text
Hay lam Wave 1: Admin dashboard dung du lieu that.

Pham vi duoc sua:
- apps/admin-web/src/pages/dashboard/AdminDashboardPage.tsx
- CSS/theme lien quan cua admin dashboard neu component hien tai dang dung class rieng.
- apps/admin-web/src/features/auth/auth.api.ts hoac hook nho neu can tai su dung API user hien co.
- apps/admin-web/src/features/masterdata/masterdata.hooks.ts chi khi can them hook dem data tu API hien co.

Khong duoc sua:
- Permission matrix / RBAC.
- Backend schema/service.
- UserManagementPage, HubManagementPage, ZoneManagementPage tru khi chi sua type import chung.

Yeu cau:
1. Doc cac client/hook hien co cua auth va masterdata truoc khi sua.
2. Dashboard phai co cac KPI toi thieu:
   - Tong user
   - User ACTIVE / DISABLED
   - So OPS / SHIPPER / MERCHANT
   - Hub active / inactive
   - Zone active
   - NDR reason active
   - Config count
3. Co loading state, empty state va error state gon gang.
4. Khong hard-code so KPI neu API da co data.
5. UI tieng Viet co dau, khong de chu "Nguoi dung = Khong co".
6. Chay:
   cd apps/admin-web
   npx tsc --noEmit

Commit goi y:
feat(admin-web): show real admin dashboard metrics
```

**Tieu chi xong:**
- Dashboard khong con thong ke tinh gay nham lan.
- Neu API loi, trang van hien thong bao gon, khong trang trang.

### Bao cao Wave 1 - Admin dashboard metrics

**Trang thai:** Hoan thanh.

**Thay doi da lam:**
- Da cap nhat `apps/admin-web/src/pages/dashboard/AdminDashboardPage.tsx` de lay so lieu tu cac query/API hien co.
- Dashboard hien thi cac KPI that:
  - Tong nguoi dung.
  - User ACTIVE / DISABLED.
  - So tai khoan Ops.
  - So tai khoan Shipper.
  - So tai khoan Merchant.
  - Hub active / inactive.
  - Zone active.
  - NDR reason active.
  - Config count.
- Da bo cac chuoi thong ke tinh nhu `Nguoi dung = Khong co`.
- Da them loading state, fetching state, empty state va error state gon gang cho dashboard.
- Da cap nhat `apps/admin-web/src/app/theme.css` de hien thi status va mo ta KPI dep, gon, khong de chu de len nhau.
- Da them `recharts` vao `apps/admin-web` de dashboard co bieu do truc quan.
- Da bo sung 3 bieu do phan tich bam sat nghiep vu admin:
  - Bieu do cot co cau tai khoan theo nhom Ops / Shipper / Merchant.
  - Bieu do donut trang thai tai khoan ACTIVE / DISABLED.
  - Bieu do cot stacked suc khoe masterdata theo active / inactive cho Hub, Zone, NDR va Config.
- Da tach bieu do Recharts sang lazy chunk rieng `AdminDashboardCharts.tsx` de tranh loi thu vien chart lam trang trang toan bo admin.
- Da them app-level error boundary cho `admin-web`, neu co runtime error se hien man hinh loi co nut tai lai thay vi trang trang.

**Tac dong nghiep vu/ky thuat:**
- Trang tong quan admin khong con la placeholder tinh.
- Co the dung dashboard de bao cao nhanh quy mo du lieu masterdata va user hien co.
- Khong them backend/API moi, chi tai su dung auth/masterdata API da co nen pham vi rui ro thap.
- Neu mot API loi hoac API tra rong, dashboard van render va hien thong bao ro rang thay vi trang trang.
- Bieu do giup giai thich nhanh co cau user, tinh trang tai khoan va muc do day du cua du lieu danh muc khi bao cao.
- Neu bieu do loi, KPI va cac module admin van render duoc; phan chart hien fallback rieng.

**Kiem chung:**
- `cd apps/admin-web && npx tsc --noEmit`: pass.
- `cd apps/admin-web && npm run build`: pass.

---

## 6. Prompt Wave 2 - doi xoa cung sang disable/soft delete

**Muc tieu:** User/hub khong bi xoa cung trong UI nghiep vu. Uu tien `status=DISABLED` voi user va `isActive=false` voi hub.

```text
Hay lam Wave 2: chuyen hanh vi xoa user/hub sang disable/soft delete trong admin-web.

Pham vi duoc sua:
- apps/admin-web/src/pages/users/UserManagementPage.tsx
- apps/admin-web/src/pages/users/MerchantUsersPage.tsx
- apps/admin-web/src/pages/masterdata/HubManagementPage.tsx
- apps/admin-web/src/features/auth/auth.api.ts / auth.client.ts neu can dung update status hien co.
- apps/admin-web/src/features/masterdata/masterdata.api.ts / masterdata.client.ts neu can dung update isActive hien co.

Khong duoc sua:
- Dashboard.
- Permission matrix.
- Backend Prisma/schema trong wave nay.

Yeu cau:
1. Tim nut "Xoa" user/hub va doi thanh "Vo hieu hoa" neu ban ghi dang active.
2. Neu ban ghi da disabled/inactive, hien hanh dong "Kich hoat lai" neu API update ho tro.
3. Khong goi delete API cho user/hub trong UI mac dinh.
4. Confirm modal/text phai noi ro du lieu khong bi xoa, chi bi ngung su dung.
5. Neu backend hien chi co delete ma khong co update status/isActive, dung API update da co neu ton tai; neu khong co, ghi ro can backend wave bo sung va khong fake thanh cong.
6. Chay:
   cd apps/admin-web
   npx tsc --noEmit

Commit goi y:
fix(admin-web): use disable flow for users and hubs
```

**Tieu chi xong:**
- UI khong con khuyen khich xoa cung user/hub.
- Thong diep confirm dung nghiep vu logistics.

**Tien do Wave 2: DONE**

**Da thuc hien:**
- `UserManagementPage.tsx`: bo nut `Xoa`, khong import/goi delete mutation; chuyen sang cap nhat `status=DISABLED` hoac `status=ACTIVE` bang update API hien co.
- `MerchantUsersPage.tsx`: bo nut `Xoa`, khong import/goi delete mutation; chuyen sang vo hieu hoa/kich hoat lai merchant bang update API hien co, giu nguyen ho so merchant.
- `HubManagementPage.tsx`: bo nut `Xoa`, khong import/goi delete mutation; nut hanh dong doi thanh `Vo hieu hoa` / `Kich hoat lai` va cap nhat `isActive=false/true`.
- Confirm/action message da noi ro du lieu khong bi xoa, chi ngung su dung trong nghiep vu logistics.

**Kiem chung:**
- `cd apps/admin-web && npx tsc --noEmit`: pass.

---

## 7. Prompt Wave 3A - validation frontend danh muc

**Muc tieu:** Bat loi som tren UI truoc khi gui API.

```text
Hay lam Wave 3A: validation frontend cho danh muc admin.

Pham vi duoc sua:
- apps/admin-web/src/pages/masterdata/HubManagementPage.tsx
- apps/admin-web/src/pages/masterdata/ZoneManagementPage.tsx
- apps/admin-web/src/pages/masterdata/ConfigManagementPage.tsx
- apps/admin-web/src/pages/masterdata/NdrReasonManagementPage.tsx
- apps/admin-web/src/constants/vnLocations.ts chi doc/tao helper neu can.

Khong duoc sua:
- Backend service/Prisma.
- Dashboard.
- Permission matrix.

Yeu cau:
1. Hub:
   - code bat buoc, uppercase/trim, khong trung voi danh sach dang load.
   - ten hub bat buoc.
   - province/district/ward phai hop le theo danh muc neu form co field nay.
2. Zone:
   - code/name bat buoc.
   - chan parent tro ve chinh no tren UI.
   - canh bao neu parent khong ton tai trong danh sach dang load.
3. Config:
   - key/scope bat buoc.
   - value JSON phai parse duoc neu field dang nhap JSON.
   - hien loi than thien, khong hien stack/JSON tho.
4. NDR reason:
   - code/name bat buoc, code unique trong list.
5. Khong lam thay doi lon UI ngoai validation/error text.
6. Chay:
   cd apps/admin-web
   npx tsc --noEmit

Commit goi y:
feat(admin-web): validate masterdata forms before submit
```

**Tieu chi xong:**
- Nhap sai khong lam crash form.
- Loi hien gan field/form, tieng Viet co dau.

**Tien do Wave 3A: DONE**

**Da thuc hien:**
- `HubManagementPage.tsx`: them validate ma hub bat buoc, trim/uppercase, check trung trong danh sach dang tai; validate ten hub, zone, tinh/thanh, quan/huyen va phuong/xa truoc khi goi API.
- `ZoneManagementPage.tsx`: validate code/name, trim/uppercase code, chan parent tro ve chinh no va bao loi neu parent khong co trong danh sach dang tai.
- `ConfigManagementPage.tsx`: validate key/scope bat buoc, parse value/default value theo kieu va hien loi JSON/number/boolean than thien.
- `NdrReasonManagementPage.tsx`: validate code/name bat buoc, trim/uppercase code va check trung code trong danh sach dang tai.

**Kiem chung:**
- `cd apps/admin-web && npx tsc --noEmit`: pass.

---

## 8. Prompt Wave 3B - validation backend danh muc

**Muc tieu:** Server moi la noi enforce that, UI chi la UX.

```text
Hay lam Wave 3B: validation backend cho masterdata-service.

Pham vi duoc sua:
- services/masterdata-service/src/api/controllers/*.controller.ts
- services/masterdata-service/src/application/services/*.service.ts
- services/masterdata-service/src/infrastructure/prisma/*.repository.ts neu can check unique/cycle.
- services/masterdata-service/prisma/schema.prisma chi khi can them constraint/index that su.

Khong duoc sua:
- apps/admin-web.
- auth-service/RBAC.

Yeu cau:
1. Hub:
   - code unique case-insensitive neu kha thi; toi thieu normalize uppercase/trim truoc khi save.
   - khong cho duplicate code.
   - validate required fields.
2. Zone:
   - khong cho parentId tro ve chinh no.
   - chan parent cycle khi update parent.
3. Config:
   - validate JSON/value theo key quan trong neu da co pattern.
   - neu chua co schema map, tao helper nho de validate cac key rui ro cao, khong over-engineer.
4. NDR reason:
   - code unique, active flag ro rang.
5. Loi tra ve message ro, phu hop voi API pattern hien co.
6. Chay:
   cd services/masterdata-service
   npx tsc --noEmit

Commit goi y:
feat(masterdata-service): enforce admin masterdata validation
```

**Tieu chi xong:**
- Loi duplicate/cycle/JSON sai bi chan tu backend.
- Khong phu thuoc vao local UI validation.

**Tien do Wave 3B: DONE**

**Da thuc hien:**
- `HubsService`: tao hub yeu cau `code`, normalize uppercase/trim, validate required fields va khong cho trung code; repository tim code case-insensitive.
- `ZonesService`: giu validation required, duplicate, parent self/cycle va parent ton tai; repository tim code case-insensitive.
- `ConfigsService`: validate `scope` khi create/update, validate JSON value hop le, config envelope va `merchant.profile.*` bang helper nho; repository tim key case-insensitive.
- `NdrReasonsService`: giu validate code/description/isActive va duplicate code; repository tim code case-insensitive.
- Khong sua Prisma schema vi cac unique constraint can thiet da co tren `code`/`key`.

**Kiem chung:**
- `cd services/masterdata-service && npx tsc --noEmit`: pass.

---

## 9. Prompt Wave 4A - RBAC backend contract

**Muc tieu:** Quyen courier-mobile khong con la prototype localStorage. Backend co API luu va doc permission.

**De xuat thiet ke toi thieu:**
- Dat permission source trong `auth-service` vi quyen gan voi user/role/session.
- Them bang:
  - `MobilePermissionProfile`: default permission theo role/nhom.
  - `MobilePermissionOverride`: override theo userId neu can.
- API de admin-web doc/ghi matrix va courier/gateway lay effective permission:
  - `GET /auth/mobile-permissions/matrix`
  - `PUT /auth/mobile-permissions/matrix`
  - `GET /auth/mobile-permissions/users/:userId/effective`
  - `PUT /auth/mobile-permissions/users/:userId`

```text
Hay lam Wave 4A: backend hoa contract RBAC cho courier-mobile trong auth-service.

Pham vi duoc sua:
- services/auth-service/prisma/schema.prisma
- services/auth-service/src/api/controllers/*
- services/auth-service/src/application/services/*
- services/auth-service/src/infrastructure/prisma/*
- services/auth-service/src/domain/* neu pattern hien co yeu cau.

Khong duoc sua:
- apps/admin-web.
- apps/courier-mobile.
- services/gateway-bff.

Yeu cau:
1. Doc pattern UserAccount/AuthSession hien co truoc khi them model/service.
2. Thiet ke permission payload tuong thich voi apps/admin-web/src/features/permissions/courierPermissionMatrix.ts va apps/courier-mobile/src/features/permissions/courier-permissions.ts.
3. Khong luu permission trong localStorage nhu source of truth.
4. Co API get/put matrix cho admin.
5. Co API get effective permission theo userId cho courier/gateway.
6. Permission key phai la enum/constant ro, tranh string lung tung nhieu noi.
7. Chay:
   cd services/auth-service
   npx prisma generate
   npx tsc --noEmit

Commit goi y:
feat(auth-service): persist courier mobile permissions
```

**Tieu chi xong:**
- Co Prisma model/API/service ro rang.
- Chua can admin UI dung API trong wave nay.

**Tien do Wave 4A: DONE**

**Da thuc hien:**
- Them Prisma model `MobilePermissionProfile` va `MobilePermissionOverride` trong `services/auth-service/prisma/schema.prisma`.
- Them domain contract `mobile-permission.entity.ts` gom actor `OPS/COURIER`, 15 permission key `scan.*`, matrix/user override/effective response types.
- Them `MobilePermissionRepository` va Prisma repository de doc/ghi profile matrix va override theo user.
- Them `MobilePermissionsService` de normalize payload, validate actor/permission key, resolve actor tu role user va tinh effective permission.
- Them `MobilePermissionsController` voi API:
  - `GET /auth/mobile-permissions/matrix`
  - `PUT /auth/mobile-permissions/matrix`
  - `GET /auth/mobile-permissions/users/:userId/effective`
  - `PUT /auth/mobile-permissions/users/:userId`
- Chua sua `admin-web`, `courier-mobile`, `gateway-bff`; localStorage chua con la backend source of truth cho contract moi.

**Kiem chung:**
- `cd services/auth-service && npx prisma generate`: pass.
- `cd services/auth-service && npx tsc --noEmit`: pass.

---

## 10. Prompt Wave 4B - admin-web permission matrix dung backend

**Muc tieu:** Trang phan quyen courier mobile luu vao backend, localStorage chi duoc dung lam fallback UI tam thoi neu co va phai ghi ro.

```text
Hay lam Wave 4B: tich hop CourierPermissionMatrixPage voi backend permission API.

Pham vi duoc sua:
- apps/admin-web/src/pages/permissions/CourierPermissionMatrixPage.tsx
- apps/admin-web/src/features/permissions/courierPermissionMatrix.ts
- apps/admin-web/src/features/auth/auth.api.ts / auth.client.ts hoac tao features/permissions/permissions.api.ts neu hop ly.
- apps/admin-web/src/services/api/endpoints.ts neu can them endpoint.

Khong duoc sua:
- services/auth-service.
- services/gateway-bff.
- apps/courier-mobile.

Yeu cau:
1. Goi API backend da co tu Wave 4A de load/save matrix.
2. Bo viec xem localStorage la source of truth.
3. Co loading/saving/error state va toast/thong bao tieng Viet.
4. Neu API chua san sang, khong fake thanh cong; hien canh bao "dang dung UI prototype".
5. Chay:
   cd apps/admin-web
   npx tsc --noEmit

Commit goi y:
feat(admin-web): save courier permissions through backend
```

**Tieu chi xong:**
- Reload browser khong mat cau hinh permission.
- UI noi ro khi save fail.

**Tien do Wave 4B: DONE**

**Da thuc hien:**
- `CourierPermissionMatrixPage.tsx`: load ma tran tu backend, save ma tran bang `PUT /auth/mobile-permissions/matrix`, hien loading/saving/error state va thong bao tieng Viet.
- Per-user view goi `GET /auth/mobile-permissions/users/:userId/effective` khi chon user va save override bang `PUT /auth/mobile-permissions/users/:userId`.
- LocalStorage khong con la source of truth khi save; chi con fallback UI prototype neu API load fail va UI hien canh bao `Dang dung UI prototype`.
- `services/api/types.ts`: mo rong method `PUT` de dung dung backend contract Wave 4A.

**Kiem chung:**
- `cd apps/admin-web && npx tsc --noEmit`: pass.

---

## 11. Prompt Wave 4C - enforce permission o gateway/courier

**Muc tieu:** Permission khong chi an/hien UI ma con chan hanh dong nhay cam tren server/gateway.

```text
Hay lam Wave 4C: enforce courier-mobile permissions o gateway va cap nhat courier app.

Pham vi duoc sua:
- services/gateway-bff/src/common/guards/*
- services/gateway-bff/src/api/courier/**
- services/gateway-bff/src/infrastructure/clients/*
- apps/courier-mobile/src/features/permissions/courier-permissions.ts
- apps/courier-mobile/src/features/auth/* neu can cache effective permissions sau login.
- apps/courier-mobile/src/navigation/AppTabs.tsx va cac man hinh chi de an/hien action theo permission.

Khong duoc sua:
- apps/admin-web permission page.
- services/auth-service schema.

Yeu cau:
1. Gateway lay effective permission tu auth-service theo user dang request.
2. Cac route/action courier quan trong phai check permission:
   - pickup scan
   - hub scan / bag seal / bag unseal
   - delivery success/fail
   - COD collect
3. Courier app duoc an/hien nut theo permission nhung server/gateway van la enforcement that.
4. Neu permission API loi, default deny voi action nhay cam.
5. Chay:
   cd services/gateway-bff && npx tsc --noEmit
   cd ../../apps/courier-mobile && npx tsc --noEmit

Commit goi y:
feat(courier): enforce mobile permissions through gateway
```

**Tieu chi xong:**
- User khong co quyen khong the goi API thanh cong bang cach bypass UI.
- Bao cao co the noi "RBAC enforced server-side".

**Tien do Wave 4C: DONE**

**Da thuc hien:**
- `gateway-bff`: them `CourierPermissionGuard` va `AuthServiceClient`; cac route nhay cam goi introspect + effective permission tu `auth-service` truoc khi proxy.
- Route enforcement: pickup scan, hub inbound/outbound scan, bag seal/unseal, delivery success/fail va COD collect. Neu permission API loi thi guard tra `Forbidden` va chan thao tac.
- `courier-mobile`: fetch effective permission sau login/restore session, cache vao user session, bo shortcut allow-all local matrix.
- UI courier an/disable action theo permission tren scan grid, task detail primary/issue action va nut thu COD.
- `ScanScreen`: refresh effective permission khi focus lai man hinh de icon chuc nang bi chan bien mat theo ma tran moi.
- Sua loi type nho o `BagSealScreen.tsx` (`shipmentCodes` chua khai bao) de typecheck app pass.

**Kiem chung:**
- `cd services/gateway-bff && npx tsc --noEmit`: pass.
- `cd apps/courier-mobile && npx tsc --noEmit`: pass.

---

## 12. Prompt Wave 5A - audit log backend

**Muc tieu:** Ghi duoc ai tao/sua/vo hieu hoa user, hub, zone, config, NDR reason.

**De xuat thiet ke toi thieu:**
- Neu chua co audit-service rieng, dung audit table theo service:
  - `auth-service`: audit user/admin auth actions.
  - `masterdata-service`: audit hub/zone/config/NDR actions.
- Shape chung:
  - `id`, `actorId`, `actorUsername`, `action`, `targetType`, `targetId`, `before`, `after`, `requestId`, `ipAddress`, `userAgent`, `createdAt`.

```text
Hay lam Wave 5A: them audit log backend cho thao tac admin.

Pham vi duoc sua:
- services/auth-service/prisma/schema.prisma
- services/auth-service/src/** lien quan user CRUD/admin actions
- services/masterdata-service/prisma/schema.prisma
- services/masterdata-service/src/** lien quan hub/zone/config/NDR CRUD

Khong duoc sua:
- apps/admin-web audit viewer.
- Dashboard/permission UI.

Yeu cau:
1. Them AdminAuditLog model hoac ten phu hop trong tung service.
2. Tao helper/service ghi audit de khong lap code qua nhieu.
3. Ghi actor/action/targetType/targetId/before/after/timestamp.
4. Lay actor tu header/context request hien co neu co; neu gateway chua truyen actor thi ghi fallback ro rang va de TODO nho.
5. Audit failure khong duoc lam hong transaction chinh neu chi loi phu, nhung phai log duoc loi.
6. Chay:
   cd services/auth-service && npx prisma generate && npx tsc --noEmit
   cd ../masterdata-service && npx prisma generate && npx tsc --noEmit

Commit goi y:
feat(admin): record audit logs for admin changes
```

**Tieu chi xong:**
- Create/update/disable/delete masterdata va user co ban ghi audit.
- Co `before`/`after` de giai thich khi bao cao.

---

## 13. Prompt Wave 5B - audit viewer trong admin-web

**Muc tieu:** Admin co man hinh xem audit log khi bi hoi "ai sua du lieu nay".

```text
Hay lam Wave 5B: them trang xem audit log trong admin-web.

Pham vi duoc sua:
- apps/admin-web/src/pages/audit/AdminAuditLogPage.tsx (tao moi)
- apps/admin-web/src/navigation/routes.ts
- apps/admin-web/src/app/AppRouter.tsx
- apps/admin-web/src/services/api/endpoints.ts va client/hook lien quan.
- CSS/theme lien quan neu can.

Khong duoc sua:
- Backend audit writer.
- Dashboard.
- Permission matrix.

Yeu cau:
1. Tao trang bang audit log co filter:
   - action
   - targetType
   - actor
   - ngay tao
2. Hien cot: thoi gian, actor, action, targetType, targetId, tom tat before/after.
3. Neu API chua co endpoint aggregate tu ca auth/masterdata, hien tung source rieng hoac ghi ro source.
4. Khong hien JSON qua dai; co nut xem chi tiet neu can.
5. Chay:
   cd apps/admin-web
   npx tsc --noEmit

Commit goi y:
feat(admin-web): add admin audit log viewer
```

**Tieu chi xong:**
- Co route xem audit log.
- Du lieu dai khong lam vo layout.

---

## 14. Prompt Wave 6 - session refresh admin-web

**Muc tieu:** Xu ly token het han dung cach thay vi de TODO.

```text
Hay lam Wave 6: hoan thien session refresh cho admin-web.

Pham vi duoc sua:
- apps/admin-web/src/features/auth/auth.session.ts
- apps/admin-web/src/features/auth/auth.api.ts
- apps/admin-web/src/features/auth/auth.client.ts
- apps/admin-web/src/store/authStore.ts
- apps/admin-web/src/services/api/client.ts

Khong duoc sua:
- Masterdata pages.
- Permission matrix.
- Backend neu auth-service da co refresh endpoint.

Yeu cau:
1. Doc auth-service auth.controller de xac nhan endpoint refresh/logout hien co.
2. Luu expiresAt/accessToken/refreshToken theo pattern hien tai.
3. Truoc request hoac khi hydrate app, neu access token gan het han thi refresh.
4. Neu API tra 401 va co refresh token, thu refresh mot lan roi retry request.
5. Neu refresh fail, logout va dua ve login.
6. Tranh race condition: nhieu request 401 cung luc chi refresh mot lan.
7. Chay:
   cd apps/admin-web
   npx tsc --noEmit

Commit goi y:
feat(admin-web): refresh admin sessions automatically
```

**Tieu chi xong:**
- Het han access token khong lam app trang trang.
- Refresh fail thi logout ro rang.

---

## 15. Prompt Wave 7 - smoke tests admin

**Muc tieu:** Co bang chung ky thuat de bao cao: cac luong admin chinh co test.

```text
Hay lam Wave 7: them smoke tests cho admin.

Pham vi duoc sua:
- Test files/scripts cua apps/admin-web.
- package.json cua apps/admin-web neu can them script test nho va phu hop voi tooling hien co.
- Khong sua feature code tru khi test phat hien bug nho can fix trong cung pham vi.

Khong duoc sua:
- Backend schema.
- Permission implementation.
- Dashboard implementation.

Yeu cau:
1. Kiem tra tooling test hien co truoc. Neu da co Vitest/Playwright thi tai su dung.
2. Test toi thieu:
   - login guard: chua login bi redirect/khong vao app.
   - dashboard render KPI shell.
   - create/update user form validation.
   - hub form validation va disable flow.
   - permission save flow mock API thanh cong/that bai.
3. Mock API gon, khong can database that.
4. Them script ro rang neu chua co, vi du `test:smoke`.
5. Chay script moi va `npx tsc --noEmit`.

Commit goi y:
test(admin-web): add smoke coverage for admin workflows
```

**Tieu chi xong:**
- Co lenh test lap lai duoc.
- Test fail that khi luong chinh bi vo.

---

## 16. Merchant profile - cach bao cao va huong nang cap

Hien merchant profile dang duoc luu trong masterdata config scope `MERCHANT_PROFILE`. Neu gan deadline, co the giu cach nay nhung phai ghi ro trong bao cao:

- Day la trade-off cho do an de tai su dung config-service/masterdata hien co.
- Khong phai thiet ke toi uu cho san pham that.
- Huong nang cap: them bang `MerchantProfile` rieng trong `auth-service` hoac service merchant rieng, lien ket voi `UserAccount`, co audit va validation CCCD/dia chi.

Prompt rieng neu con thoi gian:

```text
Hay de xuat va thuc hien nang cap merchant profile khoi MERCHANT_PROFILE config thanh model rieng.

Pham vi uu tien:
- services/auth-service/prisma/schema.prisma hoac service merchant neu repo da co.
- apps/admin-web/src/pages/users/MerchantUsersPage.tsx.

Yeu cau:
1. Khong pha du lieu cu: neu co config MERCHANT_PROFILE cu thi co duong migrate/read fallback.
2. MerchantProfile gom: userId, citizenId, region, defaultHubCode, businessName, address, status, createdAt, updatedAt.
3. Co audit khi sua profile.
4. Chay typecheck app/service lien quan.

Commit goi y:
feat(admin): store merchant profiles as first-class data
```

---

## 17. Goi y commit theo chuoi

```bash
git add apps/admin-web
git commit -m "chore(admin-web): remove unused permission prototype files"

git add apps/admin-web
git commit -m "feat(admin-web): show real admin dashboard metrics"

git add apps/admin-web
git commit -m "fix(admin-web): use disable flow for users and hubs"

git add apps/admin-web services/masterdata-service
git commit -m "feat(masterdata-service): enforce admin masterdata validation"

git add services/auth-service
git commit -m "feat(auth-service): persist courier mobile permissions"

git add apps/admin-web
git commit -m "feat(admin-web): save courier permissions through backend"

git add services/gateway-bff apps/courier-mobile
git commit -m "feat(courier): enforce mobile permissions through gateway"

git add services/auth-service services/masterdata-service
git commit -m "feat(admin): record audit logs for admin changes"

git add apps/admin-web
git commit -m "feat(admin-web): refresh admin sessions automatically"

git add apps/admin-web
git commit -m "test(admin-web): add smoke coverage for admin workflows"
```

---

## 18. Noi dung nen dua vao bao cao

- **RBAC:** Phan quyen khong chi an/hien UI, ma duoc luu backend va enforce tai gateway/API.
- **Auditability:** Moi thay doi quan trong cua admin co actor/action/before/after/timestamp.
- **Data integrity:** Danh muc co validation server-side, khong phu thuoc vao frontend.
- **Operational safety:** User/hub duoc disable thay vi xoa cung.
- **Observability:** Dashboard admin lay du lieu that tu API hien co.
- **Known trade-off:** Merchant profile co the dang dung config scope neu chua kip tach model, va da co huong nang cap ro rang.
