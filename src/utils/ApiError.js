class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack= ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.sucess = false
        this.errors = errors
        if (stack) {
            this.stack = stak
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export {ApiError}
