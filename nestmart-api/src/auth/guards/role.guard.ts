import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean  {
        // 1. Đọc cái biển hiệu xem API này yêu cầu quyền gì 
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles',[
            context.getHandler(),
            context.getClass(),
        ])

        // 2. Nếu API không dán biển hiệu (không yêu cầu role), cho qua luôn
        if(!requiredRoles) return true;

        // 3. Lấy thông tin user từ Bác bảo vệ 1 (đã lưu vào req.user)
        const {user} = context.switchToHttp().getRequest();

        if(!user){
            return false
        }

        // 4. So sánh chức vụ của user với yêu cầu của biển hiệu
        const hasRole  = requiredRoles.includes(user.role)
        
        if(!hasRole) throw new ForbiddenException('Bạn không đủ quyền hạn (Quyền Admin mới được phép)!')

        return true
    }
}