"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsOptions = {
        origin: process.env.NODE_ENV === 'production'
            ? 'https://yo-crush-repo.vercel.app'
            : true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    };
    app.enableCors(corsOptions);
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Backend running at port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map