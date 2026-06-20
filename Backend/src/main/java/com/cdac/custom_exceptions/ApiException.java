package com.cdac.custom_exceptions;

public class ApiException extends RuntimeException{
	private static final long serialVersionUID = 6157877747773494345L;

	public ApiException(String msg) {
		super(msg);
	}
}
