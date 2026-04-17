workspace "Portal Cartorial" "Diagrama C4 do sistema de serviços cartoriais digitais — TJPA" {

    model {
        # ── Personas ──────────────────────────────────────────────────────────
        cidadao    = person "Cidadão"    "Solicita documentos e acompanha pedidos via portal web"
        atendente  = person "Atendente"  "Processa e valida pedidos cartoriais no backoffice"
        admin      = person "Administrador" "Gerencia usuários, preços e configurações"

        # ── Sistemas externos ─────────────────────────────────────────────────
        govbr    = softwareSystem "Gov.br"             "SSO nacional. Autenticação de cidadãos brasileiros via OpenID Connect" "External"
        serpro   = softwareSystem "SERPRO"             "Validação de CPF via API REST" "External"
        gateway  = softwareSystem "Gateway Pagamento"  "Processamento de taxas cartoriais. Ex: PagSeguro, Cielo" "External"
        email    = softwareSystem "Serviço de E-mail"  "Envio de notificações por e-mail (SMTP/SES)" "External"

        # ── C1: Software System ───────────────────────────────────────────────
        portalCartorial = softwareSystem "Portal Cartorial" "Plataforma web para solicitação e gestão digital de serviços cartoriais" {

            # ── C2: Containers ────────────────────────────────────────────────
            webApp = container "Web App" "Interface do cidadão e backoffice do atendente. SSR + SPA." "Next.js 14 / React 18 / TypeScript" "Web Browser"

            apiBackend = container "API Backend" "Regras de negócio, REST API versionada. Valida JWT e processa pedidos." "NestJS 10 / Node.js 20 / TypeScript" {

                # ── C3: Components ────────────────────────────────────────────
                authController     = component "AuthController"      "POST /auth/login, /auth/refresh, /auth/logout"       "NestJS Controller"
                usersController    = component "UsersController"     "GET|PATCH /users, GET /users/:id"                    "NestJS Controller"
                documentsController = component "DocumentsController" "GET /documents, GET /documents/:type"               "NestJS Controller"
                requestsController = component "RequestsController"  "POST /requests, GET /requests/:id, PATCH /status"   "NestJS Controller"

                authService       = component "AuthService"       "Valida credenciais, gera/renova JWT, logout"           "NestJS Service"
                usersService      = component "UsersService"      "CRUD usuários, hash de senha, busca por Keycloak ID"   "NestJS Service"
                documentsService  = component "DocumentsService"  "Lista tipos, calcula valor, seed inicial"              "NestJS Service"
                requestsService   = component "RequestsService"   "Cria pedido, calcula taxa, muda status, enfileira PDF" "NestJS Service"

                jwtGuard          = component "JwtAuthGuard"      "Valida Bearer token em endpoints protegidos"           "NestJS Guard"
                rolesGuard        = component "RolesGuard"        "Verifica roles do usuário (cidadao/atendente/admin)"   "NestJS Guard"
                loggingInterceptor = component "LoggingInterceptor" "Auditoria de requisições HTTP"                       "NestJS Interceptor"
                jwtStrategy       = component "JwtStrategy"       "Passport strategy para validar JWT"                   "Passport Strategy"
            }

            authService_kc = container "Auth Service" "Gerencia autenticação, autorização e SSO com Gov.br via OpenID Connect" "Keycloak 23"
            worker         = container "Worker Service" "Processamento assíncrono: geração de PDFs, envio de notificações" "Bull 4 / Node.js 20"
            database       = container "Database" "Armazenamento relacional: users, document_types, requests" "PostgreSQL 16" "Database"
            fileStorage    = container "File Storage" "PDFs e documentos assinados. S3-compatible, self-hosted." "MinIO" "File Storage"
            cache          = container "Cache / Queue" "Cache de sessões Keycloak + filas Bull para workers" "Redis 7" "Database"
        }

        # ── Relacionamentos C1 ────────────────────────────────────────────────
        cidadao   -> portalCartorial "Solicita documentos e acompanha pedidos" "HTTPS"
        atendente -> portalCartorial "Processa e emite documentos" "HTTPS"
        admin     -> portalCartorial "Gerencia sistema" "HTTPS"
        portalCartorial -> govbr   "Autentica cidadão via OAuth2/OpenID Connect" "HTTPS"
        portalCartorial -> serpro  "Valida CPF do requerente" "REST/HTTPS"
        portalCartorial -> gateway "Processa pagamento das taxas" "REST/HTTPS"
        portalCartorial -> email   "Envia notificações de pedidos" "SMTP"

        # ── Relacionamentos C2 ────────────────────────────────────────────────
        cidadao   -> webApp "Acessa via navegador" "HTTPS"
        atendente -> webApp "Acessa via navegador" "HTTPS"
        webApp -> apiBackend    "Chamadas REST JSON" "HTTPS"
        webApp -> authService_kc "Autenticação OAuth2" "HTTPS"
        apiBackend -> authService_kc "Valida tokens e roles" "HTTPS"
        apiBackend -> database   "Lê e escreve dados" "TCP/5432"
        apiBackend -> cache      "Cache de sessões e publicação de jobs" "TCP/6379"
        apiBackend -> fileStorage "Salva e recupera PDFs" "S3 Protocol/HTTPS"
        apiBackend -> govbr      "SSO federado" "HTTPS"
        apiBackend -> gateway    "Processa pagamentos" "REST/HTTPS"
        worker     -> database   "Atualiza status dos pedidos" "TCP/5432"
        worker     -> fileStorage "Salva PDFs gerados" "S3 Protocol"
        worker     -> email      "Notifica cidadão por e-mail" "SMTP"
        authService_kc -> cache  "Armazena sessões" "TCP/6379"
        cache -> worker          "Consome jobs da fila" "TCP/6379"

        # ── Relacionamentos C3 ────────────────────────────────────────────────
        webApp -> authController      "POST /auth/login"    "REST/JSON"
        webApp -> requestsController  "POST /requests"      "REST/JSON"

        authController     -> authService        "delega validação"
        usersController    -> usersService       "delega operações"
        documentsController -> documentsService  "delega consultas"
        requestsController -> requestsService    "delega criação e status"

        authService        -> jwtStrategy        "valida token"
        jwtGuard           -> authService        "chama validateJwtPayload"
        requestsService    -> documentsService   "consulta valor do documento"
        requestsService    -> cache              "publica job document-generation"
        authService        -> authService_kc     "delega OAuth2"
    }

    views {
        systemContext portalCartorial "C1-SystemContext" "C1 — Contexto do sistema" {
            include *
            autoLayout lr
        }

        container portalCartorial "C2-ContainerDiagram" "C2 — Diagrama de containers" {
            include *
            autoLayout lr
        }

        component apiBackend "C3-ComponentDiagram" "C3 — Componentes da API Backend" {
            include *
            autoLayout tb
        }

        styles {
            element "Person"         { background #0D1F3C; color #ffffff; shape Person }
            element "External"       { background #999999; color #ffffff }
            element "Web Browser"    { shape WebBrowser }
            element "Database"       { shape Cylinder }
            element "File Storage"   { shape Cylinder; background #028090; color #ffffff }
            element "NestJS Controller" { background #e8f4f8; color #0D1F3C }
            element "NestJS Service"    { background #d1ecf1; color #0D1F3C }
            element "NestJS Guard"      { background #fff3cd; color #0D1F3C }
            element "NestJS Interceptor" { background #f8d7da; color #0D1F3C }
            element "Passport Strategy" { background #d4edda; color #0D1F3C }
        }
    }
}
